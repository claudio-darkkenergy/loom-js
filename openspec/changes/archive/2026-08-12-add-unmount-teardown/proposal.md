## Why

The `add-reactive-unsubscribe` slice made subscriptions disposable, but nothing disposes them automatically: every context that ever rendered under an app-lifetime activity stays pinned in that activity's `scopedActions` `Map` forever — closures, contexts, and their `ctx.root` DOM trees — and its render effects keep re-running against detached DOM on every update. The unmount signal (the `MutationObserver` in `lib/context/life-cycles.ts`) already fires; this change wires it to disposal. It also fixes a live bug found while verifying the wiring: a component _moved_ within the DOM (e.g. an array reorder via `insertBefore`) currently fires a spurious `onUnmounted` and is deleted from `lifeCycleNodes`, silencing all its future lifecycle events.

## What Changes

- `activity.effect` registers per-context cleanup (dispose its render `reactiveEffect` + release the `scopedActions` entry) on the component context when it first subscribes.
- The `MutationObserver` handler collects removal candidates and, after processing the whole batch, tears down only contexts whose roots are genuinely detached (`document.contains` check) — cascading through the context's children.
- Torn-down contexts self-heal: re-rendering (remount) re-registers the effect subscription exactly once, via the existing `!scopedActions.has(ctx)` guard.
- **Behavior fix:** moved-but-still-attached nodes no longer fire `'unmounted'` or lose their `lifeCycleNodes` registration; `onUnmounted` now fires only for genuine removals.
- `watch()` subscriptions remain caller-managed (per `reactive-unsubscribe`); app-owned hooks (memoized media queries, route watchers) are untouched.

Out of scope: releasing `ctx.root`/context objects themselves (contexts persist under live parents by design — `fix-array-slot-contexts`; their retention is bounded by app structure once `scopedActions` stops pinning them), and any `lib/utils`/app changes.

## Capabilities

### New Capabilities

- `unmount-teardown`: component contexts detached from the document have their activity-effect subscriptions disposed automatically (cascading through child contexts), moved-but-attached components are not torn down and keep their lifecycle registration, and torn-down contexts re-subscribe cleanly on remount.

### Modified Capabilities

<!-- none — no existing spec covers lifecycle semantics; the move fix is specified under the new capability -->

## Impact

- `packages/core/src/lib/context/life-cycles.ts` — batch-end detachment check; teardown dispatch; move-safe `lifeCycleNodes` handling.
- `packages/core/src/activity.ts` — register per-context cleanup on first subscription.
- `packages/core/src/types.ts` — context gains a teardown registry field (internal).
- `packages/core/tests/unit/` — new specs; existing lifecycle/array specs guard regressions.
- `@loom-js/core` changeset (minor: automatic resource release + `onUnmounted` move-semantics fix — called out in the changeset text).
