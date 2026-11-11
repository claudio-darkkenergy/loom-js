# Tasks

## 1. Failing specs

- [ ] 1.1 Add specs to `packages/core/tests/unit/template-root-forms.spec.ts` for the effect-swap re-render, list growth and shrink, nested fragment, and `onRendered` scenarios; confirm each fails on the current code with `pnpm -F @loom-js/core test-ci`.
- [ ] 1.2 Add the keyed-move scenario to `fragment-array-reconciliation.spec.ts`; confirm it fails, or record in design.md that moves already carry the right nodes and keep the spec as a guard.

## 2. Tracking

- [ ] 2.1 Record each fragment instance's top-level layout at first render and on the hydrate path, and add the refresh helper (D1, D3); the 1.1 list specs pass.
- [ ] 2.2 Refresh after the parser's update path and after an effect swaps nodes, propagating to fragment-rooted ancestors (D2); every 1.x spec passes, plus a hydrate spec with a top-level effect.
- [ ] 2.3 Run the full core suite, `type-check`, `type-check-tests`, and the devtools suite; all pass.
- [ ] 2.4 Run `pnpm bench` and compare the loom rows with `results/latest.json` from before the change; no regression beyond run-to-run noise.

## 3. Release notes

- [ ] 3.1 Add a core patch changeset describing the fixed behavior; `pnpm status-packages` lists it.
- [ ] 3.2 File-audit `SOLID-AUDIT-REPORT.md` for the touched core files and state which spec covers any new module.
