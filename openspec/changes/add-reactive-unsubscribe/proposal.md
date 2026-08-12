## Why

Nothing subscribed through loom's reactive layer can ever be released: `reactiveEffect` (`packages/core/src/lib/reactive.ts`) registers effect closures into per-prop dependency `Set`s and returns nothing, so `activity.watch` and `watchRoute` subscriptions accumulate for the app's lifetime. `watchRoute`'s JSDoc even promises "an unsubscriber method" and returns `undefined`. This is the first slice of the reactive-teardown follow-up recorded in the archived `fix-docs-toc-duplication` and `fix-per-render-hook-leaks` designs: make subscriptions _disposable_ now, defer automatic unmount-driven teardown to a later change.

## What Changes

- `reactiveEffect` returns a `dispose` function that removes the effect from every dependency `Set` it was tracked into (via a per-effect membership list). Disposal is idempotent and safe to call during a trigger pass.
- `activity(...).watch(action)` returns that dispose function as its unsubscriber.
- `router.watchRoute(action)` passes the unsubscriber through, honoring its existing JSDoc contract.
- New core unit specs pin the disposal semantics (stop-on-dispose, double-dispose, unsubscribe-during-trigger, no resurrection after dispose).
- Consumer pattern unlocked (no code change here): components can pair `watch()` with their existing `onUnmounted` hook to self-clean — the prerequisite for the deferred docs effect-boundary narrowing.

Out of scope (deliberately deferred to the automatic-teardown slice): unmount-driven cleanup wired to the `MutationObserver` lifecycle signal, releasing `activity.effect` render effects, converting `scopedActions` retention (unmounted contexts still pin their DOM), and cascading context-tree teardown.

## Capabilities

### New Capabilities

- `reactive-unsubscribe`: reactive effects and activity watchers are disposable — `reactiveEffect` and `watch` return unsubscribers that permanently stop re-runs, are idempotent, and behave safely when invoked mid-trigger; `watchRoute` forwards the unsubscriber.

### Modified Capabilities

<!-- none — existing spec'd behavior is unchanged; this adds a return value that was previously undefined -->

## Impact

- `packages/core/src/lib/reactive.ts` — `reactiveEffect` gains a return value and a per-effect membership index (touches the hot tracking path; bundle-size and runtime deltas must be checked).
- `packages/core/src/activity.ts` — `watch` returns the dispose function.
- `packages/core/src/router.ts` — `watchRoute` returns the forwarded unsubscriber.
- `packages/core/tests/unit/` — new specs for disposal semantics.
- No consumer changes required; `@loom-js/utils` and apps are unaffected (return values are additive). No changesets beyond `@loom-js/core` (patch/minor — additive API).
