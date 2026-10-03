# Tasks — component-instance-render-cost

## 1. Baseline

- [ ] 1.1 `pnpm bench` on the unchanged tree (core `dist` rebuilt first); record loom's and vanilla's op medians, startup and heap as "before" — the `keyed-list-reconciliation-perf` after column is the reference

## 2. Slot updaters (D1)

- [ ] 2.1 Red: specs for `template-slot-updates` — unchanged slots not re-written on re-render (MutationObserver attribute/childList records), context-function slots always re-apply, same `Node` left untouched, first render applies each slot once
- [ ] 2.2 Green: `setUpdatesForPaths` returns the updater list; `htmlParser` stores `ctx.values` as a plain array and runs the predicate loop on re-render; `set-reactive-updates.ts` becomes the slot-updater builder with the `updates` diagnostics group; `ComponentContext.values`/`updaters` types; `getShareableContext` unchanged in shape
- [ ] 2.3 Whole `packages/core` suite green (`test-ci` + `type-check-tests`), hydration and server lanes included

## 3. Life-cycle dispatch (D2)

- [ ] 3.1 Red: specs for `life-cycle-dispatch` — order with ref last, no re-fire on a repeated state (moved node observed as added), server render dispatches created/beforeRender/rendered only
- [ ] 3.2 Green: `dispatchLifeCycle(ctx, event)` in `life-cycles.ts`; `lifeCycles(ctx)` sets a plain `{ value }` state; `_lifeCycles.*`, `observe` and `domChanged` dispatch through it; `reactive`/`reactiveEffect` imports gone from the module
- [ ] 3.3 `tests/unit/component/life-cycles.ts`, `unmount-teardown`, `hydrate*`, `diagnostic-logging` specs green

## 4. Mount/unmount scan and lazy collections (D3, D4)

- [ ] 4.1 Red: `unmount-teardown` delta specs — nested + fragment-rooted components in one removed subtree both torn down; empty registry performs no query (spy on `querySelectorAll` via a prototype stub)
- [ ] 4.2 Measure `TreeWalker` vs node check + `querySelectorAll('*')` on the bench's 1 000 rows (added and removed); keep the faster; land the empty-registry exit either way — record the numbers here
- [ ] 4.3 Green: `children`, `refs`, `teardowns`, `registering` optional and created on first write; every reader compiles against the optional type; suite green

## 5. Evidence and release

- [ ] 5.1 `pnpm bench` after (dist rebuilt): geometric mean < 2× vanilla, every op < 3× or within 0.2 ms for sub-millisecond ops; heap for 1 000 rows before/after — record next to "before"; profile any miss before archiving
- [ ] 5.2 `turbo build --filter=@loom-js/sandbox --filter=@loom-js/loom` passes; `/benchmarks` carries the new run
- [ ] 5.3 Changeset: patch `@loom-js/core`; `pnpm format:check`; `turbo run type-check`; `.claude/skills/skill-config.md` if the templating module layout changed
