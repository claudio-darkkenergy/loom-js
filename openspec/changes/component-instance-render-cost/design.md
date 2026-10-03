# Design — component-instance-render-cost

## Context

```
htmlParser (1st render) ──► importNode ──► setUpdatesForPaths
   per dynamic path: updater = getAttrUpdate | getTextUpdate
                     setReactiveUpdates ──► reactiveEffect(values => updater(values[i])) ──► deps on ctx.values Proxy
htmlParser (re-render) ──► values.forEach((v, i) => ctx.values[i] = v) ──► Proxy set ──► predicate ──► effect ──► updater
lifeCycles(ctx) ──► reactive({ value }) + reactiveEffect(dispatch) ; `ctx.lifeCycleState.value = event` ──► handlers
domChanged ──► per added/removed node: createTreeWalker + nextNode loop ──► lifeCycleNodes.get ──► mount / candidates
```

Profiles of the loom bench app (M1 Max, Chrome 153, unminified bundle, 1 000 rows), inclusive ms per op with the profiler attached: createRows — `handleArrayValue` 22.1, of which `setUpdatesForPaths` 14.3 (`setReactiveUpdates`/`reactiveEffect` 6.2, the effects' first run 13.7 including the updaters), `importNode` 1.7, `domChanged` 1.5, DOM writes ≈3; layout (`getBoundingClientRect`) 16.7 for loom and 17.7 for vanilla. clearRows — `remove()` ×1 000 3.1 (the same as `Range.deleteContents` or `replaceChildren`, measured), `domChanged` 2.2, GC 0.8, unattributed native 26. Heap 9.25 MB vs 1.04 MB.

Constraints: no public API or template-syntax change; the slot change predicate (`Node` identity, context functions always differ, deep object diff, strict equality) stays as is; `onMounted`/`onUnmounted` timing and the move-vs-removal batching stay as the `unmount-teardown` spec requires; server rendering never reaches the observer and must keep working.

## Goals / Non-Goals

**Goals:**

- Rendering an instance allocates no reactive machinery per slot or for life-cycle state.
- A re-render applies exactly the slots whose values changed, with today's predicate.
- Mount/unmount detection costs one DOM query per added or removed node, and nothing while the registry is empty.
- Per-instance collections exist only once used.
- Bench: geometric mean < 2× vanilla; every op < 3× (sub-millisecond ops: within 0.2 ms); heap for 1 000 rows recorded before/after.

**Non-Goals:**

- The reconciler (`handleArrayValue`) and the render skip — just landed.
- The activity system (`activity.effect`, `bind`, `reactiveEffect` for activities) — stays; only its use for slot and life-cycle plumbing goes.
- Layout cost — identical for every framework.

## Decisions

### D1 — Slots: an updater array, diffed by the predicate on re-render

`setUpdatesForPaths` returns `updaters: ((value) => void)[]` in path order; each entry is today's `update(value, childCtx)` call with `appendChildContext` folded in (one function per path, no effect object). The first render stores `ctx.values = values` (a plain array) and calls every updater. A re-render runs `values.forEach((next, i) => hasChanged(ctx.values[i], next) && (ctx.values[i] = next, ctx.updaters[i](next)))`, where `hasChanged` is the predicate lifted out of the Proxy callback unchanged. `getShareableContext` keeps exposing `values` (now the array). The `updates` diagnostics group moves with the loop.

_Alternative rejected:_ keep the Proxy and only drop the per-slot effect — the Proxy's `set` trap is the same comparison with a dependency lookup on top; nothing is gained by keeping it.

### D2 — Life-cycle state: direct dispatch

`lifeCycles(ctx)` stores `ctx.lifeCycleState = { value: null }` as a plain object and `_lifeCycles.*` set state through `dispatchLifeCycle(ctx, event)`: return if `event === ctx.lifeCycleState.value`, else store it and run `ctx[event]` handlers then `ctx.ref?.[event]`. Same order, same no-re-fire-on-equal rule the `reactive` predicate gave. The `LifeCycleState` type keeps its shape (`{ value }`), so `getShareableContext` and tests reading `lifeCycleState.value` are untouched.

### D3 — Scan subtrees with one query per node

`domChanged` and the mount sweep replace the `TreeWalker` with: check the node itself, then `node.querySelectorAll('*')` once — a single native call returning the elements in document order — and look each up in `lifeCycleNodes`. Text/comment roots (fragment-rooted components register their first node) are covered by checking the node itself first, as today. When `lifeCycleNodes.size === 0` the batch exits before scanning. Measured in the change; if the query is not faster than the walker on the bench's rows it stays a walker and the empty-registry exit alone lands.

### D4 — Lazy per-instance collections

`children`, `refs`, `teardowns` become optional on the context and are created where first written (`appendChildContext`, `memoizedRefContext`, `bindAttr`/activity teardown registration). `registering` is created only by the first hook call during a render. Readers already use optional chaining or guard for `undefined`; the ones that do not are updated.

### D5 — Evidence is the bench

`pnpm bench` before (the `keyed-list-reconciliation-perf` "after" column) and after, same machine and session; the three loom-only medians, startup and heap recorded in the tasks. Sub-millisecond ops are judged on the absolute gap because the bench's timer floor is 0.1 ms.

## Risks / Trade-offs

- [A slot updater relied on being re-run by a reactive read other than its value] → none exists today (updaters read only their value and the context); the full suite, hydration and server lanes pin it.
- [Direct dispatch changes handler timing] → dispatch is synchronous, as the reactive effect was; the life-cycle specs (order, stacking, ref-last) are the regression suite.
- [`querySelectorAll('*')` misses non-element roots] → the node itself is checked first, as the walker's `currentNode` was; fragment roots register text nodes only as the first node, never nested.
- [Lazy collections leave a reader on `undefined`] → TypeScript marks them optional, so every read is checked at compile time.

## Migration Plan

1. D1 with its specs; full suite.
2. D2; life-cycle specs.
3. D3 measured, D4.
4. Bench before/after; changeset (patch); archive.
5. Rollback: revert the commits; nothing persisted.

## Open Questions

None.
