# Tasks — component-instance-render-cost

## 1. Baseline

- [x] 1.1 `pnpm bench` on the unchanged tree (core `dist` rebuilt first); record loom's and vanilla's op medians, startup and heap as "before" — 2026-10-03 05:40 UTC, M1 Max, Chrome 153, ms: createRows 18.0 / 37.6 (2.09×), replaceAll 19.7 / 47.8 (2.43×), partialUpdate 2.8 / 5.5 (1.96×), selectRow 0.1 / 0.2, swapRows 1.6 / 2.7 (1.69×), removeRow 1.5 / 2.7 (1.80×), clearRows 1.9 / 5.4 (2.84×), appendRows 19.8 / 37.4 (1.89×); geometric mean 2.06×; startup 13.9 / 17.3; heap 1.04 / 9.25 MB.

## 2. Slot updaters (D1)

- [x] 2.1 Red: specs for `template-slot-updates` — unchanged slots not re-written on re-render (MutationObserver attribute/childList records), context-function slots always re-apply, same `Node` left untouched, first render applies each slot once
- [x] 2.2 Green: `setUpdatesForPaths` returns the updater list; `htmlParser` stores `ctx.values` as a plain array and runs the predicate loop on re-render; `set-reactive-updates.ts` becomes the slot-updater builder with the `updates` diagnostics group; `ComponentContext.values`/`updaters` types; `getShareableContext` unchanged in shape
- [x] 2.3 Whole `packages/core` suite green (`test-ci` + `type-check-tests`), hydration and server lanes included

## 3. Life-cycle dispatch (D2)

- [x] 3.1 Red: specs for `life-cycle-dispatch` — order with ref last, no re-fire on a repeated state (moved node observed as added), server render dispatches created/beforeRender/rendered only
- [x] 3.2 Green: `dispatchLifeCycle(ctx, event)` in `life-cycles.ts`; `lifeCycles(ctx)` sets a plain `{ value }` state; `_lifeCycles.*`, `observe` and `domChanged` dispatch through it; `reactive`/`reactiveEffect` imports gone from the module
- [x] 3.3 `tests/unit/component/life-cycles.ts`, `unmount-teardown`, `hydrate*`, `diagnostic-logging` specs green

## 4. Mount/unmount scan and lazy collections (D3, D4)

- [x] 4.1 Red: `unmount-teardown` delta specs — nested + fragment-rooted components in one removed subtree both torn down; empty registry performs no query (spy on `querySelectorAll` via a prototype stub)
- [x] 4.2 Measure `TreeWalker` vs node check + `querySelectorAll('*')` on the bench's 1 000 rows (added and removed); keep the faster; land the empty-registry exit either way — 1 000 bench rows, median ms: TreeWalker 0.60, `querySelectorAll('*')` 0.70, `getElementsByTagName('*')` 0.30 → landed node check + `getElementsByTagName` (`forEachRegistrable`) and the empty-registry exit.
- [x] 4.3 Green: `children`, `refs`, `teardowns`, `registering` optional and created on first write; every reader compiles against the optional type; suite green

## 5. Evidence and release

- [x] 5.1 `pnpm bench` after (dist rebuilt): geometric mean < 2× vanilla, every op < 3× or within 0.2 ms for sub-millisecond ops; heap for 1 000 rows before/after — record next to "before"; profile any miss before archiving — three runs 2026-10-03 05:41–05:48 UTC (loom ms, before → after, ratio after):

    | op            | vanilla | before | after              | ratio      |
    | ------------- | ------- | ------ | ------------------ | ---------- |
    | createRows    | 18.0    | 37.6   | 31.1 / 30.9 / 30.0 | 1.67–1.73  |
    | replaceAll    | 19.7    | 47.8   | 36.8 / 37.1 / 36.5 | 1.83–1.89  |
    | partialUpdate | 2.7     | 5.5    | 4.9 / 4.6 / 4.7    | 1.74–1.81  |
    | selectRow     | 0.1     | 0.2    | 0.3 / 0.3 / 0.3    | 0.2 ms gap |
    | swapRows      | 1.6     | 2.7    | 2.8 / 2.7 / 2.6    | 1.62–1.80  |
    | removeRow     | 1.4     | 2.7    | 2.5 / 2.6 / 2.5    | 1.79–1.86  |
    | clearRows     | 1.9     | 5.4    | 4.9 / 5.3 / 5.2    | 2.58–2.79  |
    | appendRows    | 19.9    | 37.4   | 32.7 / 35.8 / 32.9 | 1.64–1.81  |

    Geometric mean 2.06× → 1.98 / 2.03 / 1.96 (the `/benchmarks` build carries the 2.03 run). Heap 9.25 → 5.07 MB; startup 17.3 → 16.3. Every op under 3×; selectRow sits on the 0.1 ms timer floor at a 0.2 ms absolute gap. clearRows is the one op still above 2.5×: 1 000 `remove()` calls (same cost as one `Range`/`replaceChildren`, measured earlier), the unmount batch (now `getElementsByTagName`) and GC of the released contexts.

- [x] 5.2 `turbo build --filter=@loom-js/sandbox --filter=@loom-js/loom` passes; `/benchmarks` carries the new run
- [x] 5.3 Changeset: patch `@loom-js/core`; `pnpm format:check`; `turbo run type-check`; `.claude/skills/skill-config.md` if the templating module layout changed — `.changeset/component-instance-render-cost.md`; format clean; 12/12 type-check tasks; `set-reactive-updates.ts` → `slot-updater.ts` noted in `docs/content-map.md` (skill-config has no per-file entry for it).
