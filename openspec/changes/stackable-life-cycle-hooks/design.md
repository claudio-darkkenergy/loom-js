# Design — stackable-life-cycle-hooks

## Context

`lifeCycles(ctx)` returns the five setters; each is guarded by `!ctx.<event>` and `createLifeCycleHook` writes a single function into `ctx.<event>` — wrapping the `ref`'s handler so it runs after the component's. `teardownContext` resets each slot to the `ref`'s handler on unmount; `component.ts` seeds the slots from the `ref` at context creation. `lifeCycleStateUpdateEffect` calls `ctx.<event>?.(ctx.root)`.

Two consequences of the single slot, both silent: a second registration for an event in the same render is dropped (host + hook, or hook + hook), and — because the `ref` seeds the slot before the child's first render — a child whose parent registered a `ref` handler for an event loses its own handler for that event (`!ctx.mounted` is already false). Current `unmount-teardown` contract: a teardown drops the component's handlers, keeps `ref` handlers, and a remount's render registers afresh.

## Goals / Non-Goals

**Goals:** every registration in the registering render fires, in order; the list is as immutable after that render as the single handler is today; `ref` handlers keep running after the component's own; no setter signature change; the existing teardown/remount contract holds verbatim for lists.

**Non-Goals:** removing handlers (no unsubscribe API); registration from outside a render gaining new semantics; a diagnostic for dropped re-render registrations (every re-render re-calls the setters — that is the normal, expected no-op); changes to `RefContext` (a ref still holds one handler per event).

## Decisions

### D1 — A handler list per event, `ref` handlers kept out of it

`ctx.<event>` becomes `LifeCycleHandler[]` holding the component's own registrations only. Firing runs the list in order, then `ctx.ref?.<event>`. Alternative: keep composing closures (today's handler group) — rejected: closures can't be reset without re-wrapping, and the `ref` seeding is exactly what blocks the component's own handler today. Separating the two sources makes ordering explicit (component handlers first, `ref` last — today's documented group order) and the teardown reset trivial.

### D2 — Lock after the registering render

A setter appends while the event's list is _open_. The list is open when it is empty, or when it already received a registration during the render in progress; it closes when that render ends. Implemented as a per-render `registering: Set<event>` on the context, created before the template function runs: a setter appends if `list.length === 0 || registering.has(event)`, then adds the event to the set. A later render starts with an empty set, so a non-empty list refuses — the exact equivalent of today's `!ctx.<event>` guard at list granularity. Alternative: lock at the end of the first render regardless of event — rejected: today a component may first register an event on a later render (conditional registration) and that must keep working.

### D3 — Teardown clears the lists

`teardownContext` resets every list to `[]` (the `ref` handler isn't in the list, so nothing to keep); `component.ts` no longer seeds slots from the `ref`. A remount's render rebuilds the lists — the `unmount-teardown` requirement reads unchanged apart from "handler" → "handlers".

### D4 — Types stay source-compatible

`LifeCycleHandlerProps` (the slots on `ComponentContextPartial`) changes shape to lists; `LifeCycleHook`, `LifeCycleHandler`, `LifeCycleHookProps`, `RefContext` do not. Consumers only touch the setters, so no public type moves.

## Risks / Trade-offs

- [A hook registering from an async callback after the render] → unchanged from today: appends only while the list is empty; documented as "register during the render".
- [Handler order across hooks becomes load-bearing] → order is registration order, which is source order in the template function — predictable and documented.
- [Child + `ref` same-event handlers both firing is new behavior] → it is what the handler-group code intended; spec scenario covers it, release note calls it out.

## Migration Plan

Core-only, additive. `apps/loom`'s hooks that take setters need no change. Minor changeset for `@loom-js/core`.

## Open Questions

None.
