# Tasks — template-instance-plan

## 1. Analysis pass (D0)

- [x] 1.1 Heap snapshot after 1 000 rows on the loom bench page (CDP `HeapProfiler`): retained bytes grouped by constructor and by closure function; rank; record the top entries and the per-row total here
- [x] 1.2 CPU profile of createRows, inclusive attribution over the unminified bench bundle; rank the per-instance steps (path resolution, attr classification, closure construction, hook surface, importNode, mount scan) by ms
- [x] 1.3 Revise `design.md` D1–D3 from 1.1/1.2 (drop anything under 5 % of bytes and ms, add anything above), decide D3's shape, re-cut sections 2–4 of this file to match; `pnpm bench` baseline on the unchanged tree recorded as "before"

### Analysis record (2026-10-03, M1 Max, Chrome 153, 1 000 rows)

Heap: snapshot diff 0 → 1 000 rows after GC, unminified bundle of `packages/core/src`. V8 heap +2 756 B/row (JSHeapUsedSize +2 992 B/row; a row's component context retains 2 120 B by dominator). Blink-side DOM/layout memory outside the metric: ~10.9 KB/row.

| per row (before)                                                                                 | bytes | share |
| ------------------------------------------------------------------------------------------------ | ----: | ----: |
| 10 `slotUpdater` closures + 10 contexts `{ctx,index,update}`                                     |   560 |  20 % |
| 6 standard-attr updaters + 6 `applyValue` + 6 contexts `{attr,dynamicNode,hostCtx,unsubscribe…}` |   552 |  20 % |
| 2 event + 2 text updaters, 4 contexts, 2 `listenerCtx` records                                   |   240 |   9 % |
| 5 hook closures, hooks object, 5 empty handler arrays                                            |   252 |   9 % |
| `updaters` + `values` arrays                                                                     |   184 |   7 % |
| activity binding per bound attr (`bind` object, `select`/`watch`, subscription closures, Set)    |  ~350 |  13 % |
| context object + property store, `node`, bound `render`, props copies, list item, strings, datum |  ~620 |  22 % |

CPU: createRows click, 100 µs sampling, 30 iterations — script 15.2 ms + mutation-observer microtask 1.3 ms + GC 1.3 ms, layout 17.3 ms (timed window median 34.3 ms unminified; 30.9 ms minified in the bench).

| step (before)                                                                                                 |  ms | share of script |
| ------------------------------------------------------------------------------------------------------------- | --: | --------------: |
| path resolution (`memo` + `childNodes[i]` reduce; leaves a NodeList on 5 elements/row)                        | 2.9 |            16 % |
| per-path wiring (classification 0.9, text split + fragment swap 1.3, `removeAttribute` 0.3, closures)         | 3.0 |            17 % |
| initial-apply overhead (`slotUpdater` 0.8, `canDebug` 0.5, `appendChildContext` 0.4, text create+replace 0.7) | 2.3 |            13 % |
| `importNode`                                                                                                  | 1.6 |             9 % |
| DOM writes (`setAttribute` ×6, `addEventListener` ×2, `bindAttr`)                                             | 1.4 |             8 % |
| mount scan (`domChanged`)                                                                                     | 1.3 |             7 % |
| hook surface + context setup (`contextFunction` self, `lifeCycles`)                                           | 1.1 |             6 % |
| placement (`insertBefore` ×1 000)                                                                             | 1.0 |             6 % |
| GC                                                                                                            | 1.3 |             7 % |

clearRows (5.0 ms): `node.remove()` ×1 000 = 2.8 ms, then the unmount scan and a teardown allocating 5 handler arrays per row.

`pnpm bench` before (`results/latest.json` of 2026-10-03T16:54Z): createRows 30.9 (1.69×), replaceAll 36.2 (1.84×), partialUpdate 4.8 (1.78×), selectRow 0.3 (3.0×), swapRows 2.7 (1.69×), removeRow 2.7 (1.80×), clearRows 5.0 (2.63×), appendRows 32.0 (1.62×); geometric mean 1.96×; heap 4.83 MB (vanilla 0.99); startup 16.7 ms (vanilla 13.5).

### After (2026-10-03, three runs; the third is the build's own `/benchmarks` run)

Heap: V8 +1 274 B/row (was 2 756): 10 slots 240 B + their array 82 B, the activity binding ~350 B, context object 28 B (13 properties, no out-of-object store), `node` 48 B, bound `render` 24 B, props copies / list item / datum ~92 B, two template closures 76 B, strings ~57 B; no updater, hook or handler-array allocation remains. Blink-side memory dropped ~0.9 KB/row (no NodeList per visited element, no HTMLCollection per clone).

CPU, createRows click: script 8.0 ms (was 15.2) — `importNode` 1.4, slot wiring 1.2 (step walk 0.9), apply 1.8 (DOM writes 1.1, `bindAttr` 0.4), `contextFunction` + props 1.0, `htmlParser` self 0.5, reconciler 0.7 (`replaceChildren` 0.5); mutation-observer microtask 0.8 (was 1.3); GC 0.2 (was 1.3). clearRows click: `replaceChildren` 2.2 of a 2.7 ms handler, observer 1.2 (unmount scan 0.5, teardown 0.4), GC 1.2.

| op (loom / vanilla, ratio) | after #1   | after #2   | after #3   | gate           |
| -------------------------- | ---------- | ---------- | ---------- | -------------- |
| createRows                 | 23.5 1.31× | 22.4 1.24× | 22.8 1.30× | < 1.3×         |
| replaceAll                 | 26.9 1.33× | 26.0 1.32× | 26.3 1.34× | < 1.3×         |
| appendRows                 | 27.3 1.37× | 27.4 1.37× | 26.4 1.37× | < 1.3×         |
| clearRows                  | 3.6 1.80×  | 3.7 1.85×  | 3.5 1.75×  | < 1.4×         |
| partialUpdate              | 4.3 1.48×  | 4.2 1.45×  | 4.2 1.56×  | ≤ before 1.78× |
| selectRow                  | 0.2 2.00×  | 0.3 3.00×  | 0.3 3.00×  | ≤ before 3.00× |
| swapRows                   | 2.6 1.73×  | 2.7 1.59×  | 2.6 1.53×  | ≤ before 1.69× |
| removeRow                  | 2.7 1.80×  | 2.5 1.79×  | 2.5 1.79×  | ≤ before 1.80× |
| geometric mean             | 1.58×      | 1.63×      | 1.64×      | < 1.5×         |
| heap                       | 2.50 MB    | 2.50 MB    | 2.50 MB    | < 3 MB         |

Met: heap, createRows (at the line), every "not above before" ratio (swapRows's 1.73× in run #1 is the 0.1 ms quantization of a 1.5–1.7 ms op). Missed: replaceAll by ~0.03×, appendRows by ~0.07×, clearRows by ~0.4×, the geometric mean by ~0.1×. What the profiles leave: the unmount scan and teardown (~1 ms per 1 000 rows, the one-query-per-node rule of the `unmount-teardown` spec), GC after removing 1 000 listener-bearing rows (~1 ms), and the reused-item path of a keyed pass (`haveEqualProps`, `isLiveContext`, index maps and LIS over 2 000 items: ~1–1.5 ms on appendRows) — reconciler and render-skip territory this change's non-goals exclude.

## 2. Plan compile (D1)

- [x] 2.1 Red: `template-instance-plan` specs — plan built once for 1 000 instances (spy on the classifier), per-document plans, slot count = dynamic path count, no `childNodes` access while an instance renders, no special attribute and no token-bearing text node left in a clone
- [x] 2.2 Green: fragment normalized at first parse per document (text/comment token nodes split in place, special attributes classified then stripped); `TemplatePlan` (`steps`, `entries`) compiled from it and stored on `htmlParser`'s cache entry; classification lifted from `getSpecialAttrUpdate`'s precedence; types in `src/lib/templating/types.ts`; `get-paths.ts` replaced by the plan compiler

## 3. Slots and shared apply functions (D2)

- [x] 3.1 Red: `template-slot-updates` delta — one slot per path, functions reachable from a context do not grow with path count; observable-semantics pins for attr, bind, `$event`, `$attrs`, `$on`, `$props`, style, custom-element props (existing specs re-run, new ones only where a captured variable moves into `Slot.state`); text slot writes a primitive in place and still replaces for nodes
- [x] 3.2 Green: `ctx.slots: Slot[]` replaces `updaters`/`values`; `applyText`/`applyAttr`/`applyEvent`/`applyAttrs`/`applyOn`/`applyProps`/`applyCustom` as module functions `(slot, value, ctx, index)`, every captured variable of today's updater closures enumerated into `Slot.state` or read from the entry; instance wiring walks `steps` with `firstChild`/`nextSibling` and builds slots over `entries`; `set-updates-for-paths.ts`, `slot-updater.ts`, `get-live-text-nodes.ts`, `get-dynamic-element.ts` removed; render loop in `htmlParser` over slots with the debug narration in its group
- [x] 3.3 Whole `packages/core` suite green (`test-ci` + `type-check-tests`), hydration and server lanes included

## 4. Hook surface (D3)

- [x] 4.1 Red: `life-cycle-handler-stacking` delta — unregistered events hold no list, a render that captures no hook retains no hook function; existing stacking/locking/ref-order specs re-run
- [x] 4.2 Green: `lifeCycleHooks(ctx)` creates the five hooks per render for the props object, `ctx.lifeCycles` removed; handler arrays created on first registration, dispatch reads with `?.`, `teardownContext` resets to `undefined`
- [x] 4.3 Life-cycle, teardown, refs, hydration and diagnostics specs green

## 5. Whole-list replacement (D6)

- [x] 5.1 Red: `keyed-list-diffing` delta — replacing every item (clear, fresh list, full replacement) is one `replaceChildren`; reorders, removals and appends still take the per-item path; contexts of the replaced keys are released
- [x] 5.2 Green: fast path in `handleArrayValue` when no item is reused and the previous nodes (or the placeholder) are all of their parent's children

## 6. Evidence and release

- [ ] 6.1 `pnpm bench` after (dist rebuilt): createRows/replaceAll/appendRows < 1.3×, clearRows < 1.4×, geometric mean < 1.5×, nothing above its "before" ratio; heap snapshot per row before/after — record next to the analysis record; profile any miss before closing
- [x] 6.2 `turbo build --filter=@loom-js/sandbox --filter=@loom-js/loom` passes; `/benchmarks` carries the new run
- [x] 6.3 Changeset: patch `@loom-js/core`; `pnpm format:check`; `turbo run type-check`; `.claude/skills/skill-config.md` and `docs/content-map.md` for the templating module changes
