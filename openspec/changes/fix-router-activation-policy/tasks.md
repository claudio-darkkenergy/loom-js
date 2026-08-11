## 0. Prerequisites

- [ ] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; measure `dist/index.mjs` min+gzip (expected ≈ 10,574 B post-`add-core-element-components`) to anchor the 64 B budget (design Decision 3).
- [ ] 0.2 Re-read the `router.ts` 🟡 audit entry so the refactor lands its recommended fix verbatim (module-level helpers, public API unchanged).

## 1. Activation policy (Red → Green)

- [ ] 1.1 Specs in `tests/unit/route-activation.spec.ts`: plain click routes (default prevented, pathname updates); ctrl/meta/shift/alt-modified clicks each fall through (no preventDefault, no history change); already-`defaultPrevented` events fall through. Confirm red for the right reason (shift/alt/prevented currently hijack).
- [ ] 1.2 Generalize the `route()` guard per design Decision 1.
- [ ] 1.3 Suite + type-checks green.

## 2. SRP refactor (audit 🟡)

- [ ] 2.1 Extract `matchRoute` and `extractParams` as pure module-level helpers per design Decision 2; `transform` becomes the orchestrator; no public API change.
- [ ] 2.2 Full suite + type-checks green; measure the combined byte delta against the 64 B budget.

## 3. Close-out

- [ ] 3.1 `SOLID-AUDIT-REPORT.md`: move the `packages/core/src/router.ts` entry to ✅ Resolved with the resolution recorded (solid-audit format).
- [ ] 3.2 Prettier `--check` clean on changed files.
- [ ] 3.3 Patch changeset for `@loom-js/core`.
