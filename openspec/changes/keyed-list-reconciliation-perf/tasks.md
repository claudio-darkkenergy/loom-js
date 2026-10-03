# Tasks — keyed-list-reconciliation-perf

## 1. Baseline

- [x] 1.1 `pnpm bench` on the unchanged tree; copy loom's and vanilla's op medians, startup and heap into the archive note as "before" — 2026-10-03 01:49 UTC, M1 Max, Chrome 153, medians in ms:

    | op            | vanilla | loom before | ratio |
    | ------------- | ------- | ----------- | ----- |
    | createRows    | 18.5    | 48.1        | 2.60  |
    | replaceAll    | 19.5    | 59.7        | 3.06  |
    | partialUpdate | 2.8     | 59.1        | 21.1  |
    | selectRow     | 0.1     | 0.4         | 4.00  |
    | swapRows      | 1.6     | 56.8        | 35.5  |
    | removeRow     | 1.4     | 58.6        | 41.9  |
    | clearRows     | 2.0     | 5.0         | 2.50  |
    | appendRows    | 20.0    | 135.1       | 6.75  |

    Geometric mean 8.01×. Startup vanilla 13.6 / loom 16.1; heap 1.04 MB / 9.25 MB.

## 2. Detection by marker (D1)

- [x] 2.1 Red: core spec that bundles a keyed-list fixture with esbuild `minify: true` (no `keepNames`), updates the list and asserts node identity + `onCreated` count unchanged
- [x] 2.2 Green: `appendChildContext`, the html-parser value diff and the style-arg branch call `isContextFunction` / `isActivityContextFunction`; no `Function.name` checks remain outside `contextFunctionKind`'s fallback
- [x] 2.3 Commit on its own (bug fix); `pnpm bench` once more for the "marker fix only" column — measured (dist rebuilt first; the bench bundles core from `dist/`): createRows 53.0 (2.93×), replaceAll 63.4 (3.19×), partialUpdate 11.8 (4.37×), selectRow 0.6, swapRows 34.4 (21.5×), removeRow 32.6 (21.7×), clearRows 5.4 (2.84×), appendRows 68.5 (3.44×); geometric mean 5.70×.

## 3. Key without rendering (D3)

- [ ] 3.1 Red: spec asserting the reconciler never invokes an item in dry-run mode (spy on the context function) and still keys by `key`
- [ ] 3.2 Green: `component()` sets `contextFunction.key`; `handleArrayValue` reads it; `ContextFunction` type gains `key?`; `getContextForValue` untouched

## 4. Keyed diff with minimal moves and context release (D2, D5)

- [ ] 4.1 Red: specs counting `insertBefore`/removal via `MutationObserver`: swap → 2 moves, mid removal → 0 moves + 1 removal, append 1 000 onto 1 000 → 1 000 insertions and 0 moves; `children` map size after three replace-alls = item count; `onUnmounted` fires for a removed key
- [ ] 4.2 Green: rewrite `handleArrayValue` — key index of previous entries, LIS over reused items' old positions, back-to-front insertion of the rest before the next kept sibling, removal + `children.delete(key)` for absent keys; groups (fragment items) stay the unit; empty-group anchors and falsy keys preserved
- [ ] 4.3 Whole `packages/core` suite green (`test-ci` + `type-check-tests`), including every `activity-array-reactivity`, `named-slots`, `template-root-forms` and `unmount-teardown` spec

## 5. Render skip on equal props (D4)

- [ ] 5.1 Red: specs for the skip (900 of 1 000 rows' `onRendered` silent on a 10 % label change), the forced cases (first render, remount, fingerprint change, changed prop, new `children` reference) and an own-activity effect still updating a skipped instance
- [ ] 5.2 Green: props compare in `contextFunction` on a live context; return the context before the template call
- [ ] 5.3 Docs: Components topic rendering section states the rule; `docs/content-map.md` entry; push the topic draft to Contentful

## 6. Evidence and release

- [ ] 6.1 `pnpm bench` after; loom geometric mean < 2× vanilla and every op < 3× — record "after" next to "before"; if an op misses, profile it before archiving rather than tuning the bench
- [ ] 6.2 `pnpm -F @loom-js/sandbox build` and the docs app build still pass; `/benchmarks` rebuilds with the new numbers
- [ ] 6.3 Changeset: minor `@loom-js/core`; `pnpm format:check`; `turbo run type-check`
