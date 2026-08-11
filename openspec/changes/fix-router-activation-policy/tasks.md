## 0. Prerequisites

- [x] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; measure `dist/index.mjs` min+gzip (expected ≈ 10,574 B post-`add-core-element-components`) to anchor the 64 B budget (design Decision 3). → All green (163 passed). Measured **10,607 B**, not 10,574: the tree carries unrelated in-flight work (uncommitted `fix-docs-toc-duplication` WIP touching `lib/context/helpers.ts`, +33 B, +1 spec file). Budget anchored at 10,607 B → ceiling **10,671 B**; this change stages only its own files.
- [x] 0.2 Re-read the `router.ts` 🟡 audit entry so the refactor lands its recommended fix verbatim (module-level helpers, public API unchanged). → Entry recommends extracting `matchRoute`/`extractParams`/`validateRoute`-style helpers in the same file; `validateRoute` stays a method per design Decision 2 (needs `redirect`/`routesConfig`).

## 1. Activation policy (Red → Green)

- [x] 1.1 Specs in `tests/unit/route-activation.spec.ts`: plain click routes (default prevented, pathname updates); ctrl/meta/shift/alt-modified clicks each fall through (no preventDefault, no history change); already-`defaultPrevented` events fall through. Confirm red for the right reason (shift/alt/prevented currently hijack). → 6 specs; red on exactly shift/alt/prevented.
- [x] 1.2 Generalize the `route()` guard per design Decision 1.
- [x] 1.3 Suite + type-checks green. → 169 passed.

## 2. SRP refactor (audit 🟡)

- [x] 2.1 Extract `matchRoute` and `extractParams` as pure module-level helpers per design Decision 2; `transform` becomes the orchestrator; no public API change. → `extractParams` now returns its object instead of mutating `this.params`; `pathSegmentRx` demoted to a module const.
- [x] 2.2 Full suite + type-checks green; measure the combined byte delta against the 64 B budget. → 169 passed; **32 B of 64 B** (10,639 B against the 10,607 B anchor).

## 3. Close-out

- [x] 3.1 `SOLID-AUDIT-REPORT.md`: move the `packages/core/src/router.ts` entry to ✅ Resolved with the resolution recorded (solid-audit format). → moved with Resolution + dates; summary counts updated (🟡 5, ✅ 2).
- [x] 3.2 Prettier `--check` clean on changed files.
- [x] 3.3 Patch changeset for `@loom-js/core`. → `.changeset/router-activation-policy.md`.
