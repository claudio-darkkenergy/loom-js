## 1. Reproduce (Red)

- [x] 1.1 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `html-parser.ts`, `context/helpers.ts`, `get-text-update.ts`, `component.ts`; resolve blockers first. — None; the only 🔴 Critical is `services/api/log.ts`.
- [x] 1.2 Move the numeric-key reconciliation test from `activity-array.spec.ts` (currently `it.skip`) into an active failing test; add a test asserting an effect resolves each array item exactly once per update (spy count).
- [x] 1.3 Run `pnpm -F @loom-js/core test-ci` and confirm the numeric test fails for the documented reason (childCtx deleted by Pass B).

## 2. Fix — Decision A (non-destructive cleanup)

- [x] 2.1 In `appendChildContext` (`packages/core/src/lib/context/helpers.ts`), stop the `else`-branch `children.delete(key)` from deleting a keyed child context when the reconciled value is a DOM `Node` (the Pass B resolved-element case). Preserve legitimate component→text/primitive cleanup.
- [x] 2.2 Re-run `test-ci`; confirm the numeric-key test passes and string-keyed tests still pass. — 56/56 green.

## 3. Fix — escalate only if 2 is insufficient

- [x] 3.1 ~~Decision B: html-parser `ContextFunction` identity/fingerprint diff.~~ Not needed — Decision A alone makes the whole suite green. Pass B still runs but is now harmless; eliminating it remains a perf-only follow-up.
- [x] 3.2 ~~Decision C: dedicated child-context scope for the effect subtree.~~ Not needed.

## 4. Regression + verify

- [x] 4.1 `pnpm -F @loom-js/core test-ci` fully green — 56 passed, 0 failed across 8 files (the previously-noted `routing.spec` import error is no longer present).
- [x] 4.2 `pnpm -F @loom-js/core type-check` and `type-check-tests` — both clean. `apps/loom type-check` has the same 9 pre-existing errors before and after this change.
- [x] 4.3 Verified in real Chrome via puppeteer against a temporary numeric-keyed harness served by the example app: baseline recreated keys `1`,`2`,`3` (the index-colliding ones) on reorder; with the fix all keys are reused across a reversal and a shuffle. String-keyed reuse in `activity-effect-nested-array` stayed 7/7. `apps/loom` builds and renders `/` and `/docs` with no reconciliation errors (only API-absent fetch errors). Temp harness removed.

## 5. Release & conventions

- [x] 5.1 Prettier per `.prettierrc` — `--check` clean on all changed files.
- [x] 5.2 Changeset for `@loom-js/core` at `.changeset/array-double-reconciliation.md`; notes the numeric-key limitation from `fix-activity-array-node-reuse` is resolved.
- [x] 5.3 `SOLID-AUDIT-REPORT.md` — no touched file has an entry, no new violation introduced. `.claude/skills/skill-config.md` — no conventions changed. Both no-ops.
- [x] 5.4 Updated `.changeset/activity-array-node-reuse.md` to point at this change, and added a `## MODIFIED Requirements` delta so archiving strips the stale "numeric keys are a known limitation" paragraph from `openspec/specs/activity-array-reactivity/spec.md`.
