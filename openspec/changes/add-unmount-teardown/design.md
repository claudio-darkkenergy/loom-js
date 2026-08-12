## Context

`lib/context/life-cycles.ts` observes the app root with a `MutationObserver`; `domChanged` walks removed subtrees with a `TreeWalker`, and for each element found in `lifeCycleNodes` it fires `'unmounted'` and deletes the registration. Because it processes each mutation record eagerly, a node that is _moved_ (removed and re-inserted in one batch — exactly what `handleArrayValue`'s `insertBefore` reordering does) fires a spurious `'unmounted'` and loses its registration before the added-record is processed, so its later lifecycle events are silenced. This is a live bug independent of teardown.

`activity.effect`'s context function registers `reactiveEffect(renderEffect, valueProp)` on first call per context and stores the action in the activity-private `scopedActions: Map<ctx, action>` — a strong map that pins every context (and its `ctx.root` DOM) for the activity's lifetime. Since `add-reactive-unsubscribe`, that `reactiveEffect` call returns an `Unsubscriber` — currently discarded. The first-call guard (`!ctx.root || !scopedActions.has(ctx)`) means a context whose entry is removed re-registers cleanly the next time its context function runs.

Constraints: core is zero-dependency and size-tracked; `deep`/`force` activity semantics and context persistence under live parents (`fix-array-slot-contexts`) must be preserved.

## Goals / Non-Goals

**Goals:**

- Genuinely detached component contexts stop receiving activity updates: their render-effect subscriptions are disposed and their `scopedActions` entries released, cascading through child contexts.
- Moved-but-attached components are not torn down, keep their `lifeCycleNodes` registration, and no longer fire spurious `'unmounted'`.
- Remount after teardown re-subscribes exactly once (self-healing via the existing first-call guard).

**Non-Goals:**

- Releasing context objects or `ctx.root` references (bounded by app structure once `scopedActions` no longer pins them; revisit if measurements say otherwise).
- Auto-disposing `watch()` subscriptions (caller-managed per `reactive-unsubscribe`) or touching `lib/utils`/app hooks.
- A public teardown API — this slice is entirely internal wiring.

## Decisions

**D1 — Batch-end detachment check, shared by lifecycle events and teardown.** `domChanged` first collects candidate (node, ctx) pairs from removed records and processes added records as today, then — after the loop — filters candidates with `document.contains(root)`. Still-attached candidates are _kept_ in `lifeCycleNodes` and fire nothing; detached candidates fire `'unmounted'`, are deregistered, and are torn down. One check fixes the move bug and gates teardown. Alternative — a microtask/`requeue` deferral — adds timing complexity without covering cross-batch moves any better (a node removed in one batch and re-inserted in a later one still fires unmounted between; accepted as today's semantics).

**D2 — Cleanup registry lives on the context.** New internal field `ctx.teardowns?: Set<Unsubscriber>`. In `activity.effect`'s first-call branch, after `reactiveEffect` returns its disposer, register one cleanup closure: dispose the render effect and `scopedActions.delete(ctx)`. The activity's internals stay private — the context only holds opaque `Unsubscriber`s. Alternative — a module-level `WeakMap<ctx, Set>` registry — hides the field from `ComponentContext` but adds an import cycle between `activity.ts` and the teardown module; the typed optional field is simpler and matches how `ctx` already carries lifecycle state.

**D3 — Teardown cascades through `ctx.children`, and clears `teardowns` after running.** `teardownContext(ctx)`: run and clear `ctx.teardowns`, then recurse into `ctx.children` values. Cascade only ever starts from a genuinely detached root (D1), so context persistence under live parents is untouched. Child contexts are _not_ removed from their parent's `children` map — persistence semantics stay identical; only subscriptions are released.

**D4 — Self-healing remount is a specified behavior, not an accident.** After teardown, the context's next render (its context function re-invoked, e.g. on remount) hits the `!scopedActions.has(ctx)` branch and re-registers — one new subscription, one new cleanup registration. Pinned by spec scenario so future refactors of the first-call guard can't silently break remount.

**D5 — Teardown module placement.** The walk lives in `life-cycles.ts` (it is lifecycle plumbing and already imports nothing from `activity.ts`; the registry field keeps it decoupled). If it grows, extraction into `lib/context/teardown.ts` is mechanical — noted for the file's existing 🟢 SRP audit entry rather than done now.

## Risks / Trade-offs

- [`onUnmounted` semantics change for moved nodes] → Intended fix, but observable: any consumer relying on unmount-fires-on-move (none found in repo or docs app) would break. Called out in the changeset; covered by a move scenario spec.
- [Batch-end check costs one `document.contains` per removed component root] → Cheap relative to the `TreeWalker` pass that already runs; no per-update cost when nothing is removed.
- [Teardown races an in-flight `trigger` pass] → Disposal is mid-trigger-safe by `reactive-unsubscribe` design (disposed flag); the torn-down effect simply no-ops if a pass already captured it.
- [A context torn down while its DOM is detached but _cached for reuse_ (e.g. lazy-import page cache) re-subscribes on next render] → That is the desired self-healing path (D4); the cost is one re-registration per remount, identical to first mount.
- [Contexts and `ctx.root` remain reachable via parent `children` maps] → Accepted for this slice (bounded, unlike per-activity `scopedActions` growth); a follow-up can measure and prune if real apps show pressure.
