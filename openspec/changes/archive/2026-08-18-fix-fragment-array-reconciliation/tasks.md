## 1. Baseline and audit

- [x] 1.1 Record the `@loom-js/core` dist min+gzip baseline (same measurement command as the named-slots change) before any edits
    - Baseline: **9,847 B** (`pnpm -F @loom-js/core build-package`, then `pnpm exec esbuild dist/index.mjs --minify | gzip -9 | wc -c`).
- [x] 1.2 Audit consumers of the live-node round-trip (`set-updates-for-paths.ts`, `context/`, `hydrate`, `updateLiveNode` callers) to confirm the nested entry shape (`TemplateRoot | TemplateRoot[]`) stays internal to `get-text-update.ts`; note findings in this file (Decision 4)
    - Finding: the nested shape **would escape** — `activity.ts:130` assigns `textUpdater`'s return to `ctx.root`, which is then read by `resolve-value.ts` (returns `resultCtx.root` as a resolved value), `context/helpers.ts` (`getContextRootAnchor` indexes `root[0]`), `lib/context/life-cycles.ts` (hooks receive `ctx.root`), and `mount.ts`.
    - Resolution (within Decision 4's intent): `textUpdater`/`handleArrayValue` keep returning a **flat** `TemplateRootArray`; group boundaries are stored in a module-level `WeakMap` keyed by the returned array instance, recovered on the next pass (the array round-trips by reference through `ctx.root` and the `getTextUpdate` closure). A flat array with no stored entries degrades to today's per-node reconciliation. Public types stay untouched, and `updateLiveNode` needs no flatten change since it only ever receives flat arrays — 3.4's `updateLiveNode` clause is thereby satisfied with no code change.
    - Sound because a component/region context's fragment root array instance is stable across re-renders (`html-parser.ts` assigns it only on initial render), so first-node identity holds for reused items.

## 2. Failing specs (red)

- [x] 2.1 Add a spec file under `packages/core/tests/` covering the "Fragment-rooted array items render their nodes" requirement: fragment region as a children-array item renders all nodes, no `[object ` text; equivalence with direct interpolation
- [x] 2.2 Add specs for "reconcile as a unit": reorder moves the whole group with node identity preserved, truncation removes every group node, mixed single/text/fragment arrays keep exact child order, kind change (fragment ⇄ element ⇄ text) fully replaces the previous rendering
- [x] 2.3 Add a spec for the empty-group anchor: item resolving to zero nodes holds position and re-fills between the same siblings on a later update
- [x] 2.4 Run `pnpm -F @loom-js/core test-ci` and confirm the new specs fail for the expected reason (stringified text / missing nodes), with all existing specs still green
    - All 7 new specs (`tests/unit/fragment-array-reconciliation.spec.ts`) fail red with the expected `[object Text],[object HTMLElement]` stringification. One unrelated failure (`attr-value-semantics` › `$attrs` style entry) belongs to the in-flight working-tree changes of `fix-empty-style-sentinel`, not this change — with the working tree stashed, the suite is 227/227 green.

## 3. Implementation (green)

- [x] 3.1 In `handleArrayValue` (`get-text-update.ts`), branch on `Array.isArray(resolvedValue)`: coerce group nodes individually (element/comment kept, else text), insert the run contiguously before the cursor, and store the group as a single live-node entry (Decision 1)
- [x] 3.2 Generalize identity/move logic to groups — first-node identity for `isSameNode`/`includes`/`indexOf` equivalents, whole-run `insertBefore` on reorder, cursor derived from the flattened first node of the target entry (Decision 2)
- [x] 3.3 Insert an empty `Text` anchor for a group resolving to zero nodes (Decision 3)
- [x] 3.4 Make cleanup group-aware: truncation removes every node of dropped entries; `updateLiveNode`'s array-to-single transition flattens nested entries before removal
    - `updateLiveNode` needed no change: per the 1.2 resolution, returned arrays are always flat (`nextEntries.flat()` + WeakMap side-table), so its array cleanup path only ever sees plain nodes.
- [x] 3.5 Run `pnpm -F @loom-js/core test-ci` until the new specs and the full existing suite (keyed reorder, falsy keys, persistent array-slot contexts) are green
    - 237 passed, 0 failures from this change (the lone remaining failure is the pre-existing `fix-empty-style-sentinel` working-tree one noted at 2.4).

## 4. Verification and docs

- [x] 4.1 Run `pnpm -F @loom-js/core type-check` and `pnpm -F @loom-js/core type-check-tests`
- [x] 4.2 Re-measure dist min+gzip; record the delta against the 1.1 baseline and, if over the 256 B target, record the breach and reason here (Decision 5)
    - Post-change: **9,807 B** — **40 B under** the 9,847 B baseline (the restructured `handleArrayValue` compresses better than the old inline form). No breach.
- [x] 4.3 Remove the "arrays of regions are unsupported" caveat wherever it is documented (`packages/core/README.md` and any docs-app content that states it)
    - Updated `packages/core/README.md` (element-syntax composition constraints) and `.claude/skills/skill-config.md` (authoring-convention entry, per the Skill Config Rule). `CHANGELOG.md` and archived openspec docs are historical records and stay as written.
- [x] 4.4 Add a changeset for `@loom-js/core` (patch: bug fix, no API change)
- [x] 4.5 Run `pnpm format` and confirm `pnpm format:check` passes
    - Scoped to this change's files (`prettier --write <files>` + `--check`) instead of the tree-wide script: a concurrent session has in-progress edits in `get-attr-update.ts` / `attr-value-semantics.spec.ts` and asked that they not be touched. All of this change's files pass the check.
    - Final verification: full core suite **238 passed, 0 failed**; both type-checks clean.
