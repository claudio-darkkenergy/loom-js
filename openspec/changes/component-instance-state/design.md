# Design — component-instance-state

## Context

Component contexts persist across re-renders (keyed by `ctxScopes`/fingerprint); the render function does not — locals die per render. `memoizedRefContext` already bridges this for refs: an iterator over `ctx.refs` replays cached `RefContext`s in call order, creating only when the iterator runs dry. Pink's copy-button relies on closure state and is correct only because its hosts never re-render it; the docs' Disclosure example documents the reset boundary explicitly.

## Goals / Non-Goals

**Goals:** arbitrary per-instance values surviving parent re-renders; the `createRef` mechanism reused, not duplicated; zero cost to components that don't use it.

**Non-Goals:** a hooks ecosystem (one utility, not a family); reactive semantics of its own (it stores what you give it — an activity if you want reactivity); keyed/conditional variants (call-order positional only, like `createRef`); teardown ownership (pair with `onUnmounted` explicitly — the utility stores, the author disposes).

## Decisions

### D1 — Positional memoization via the existing ref machinery, generalized

A per-context value list + iterator mirroring `ctx.refs`: first render pushes `create()` results; re-renders replay in call order. Implementation should share or closely mirror `memoizedRefContext` rather than introduce a second pattern. Misuse (different call count/order across renders) gets the same stance as hooks: documented rule, plus a debug-lane warning when the iterator over/underruns.

### D2 — Naming and surface

Working name `own` (`const isOpen = own(() => activity(false))`) — short, reads as possession, no `use` prefix baggage. Alternatives at review: `keep`, `local`, `memoLocal`. It rides `UtilityProps` beside `node`/`createRef`/`ctxRefs`, so it appears in the Built-in props section like the rest.

### D3 — Lifetime and isolation

Values live exactly as long as the component context (per instance, per window — SSR isolation inherited from context ownership). Unmount drops the context and its values; authors needing disposal pair `own` with `onUnmounted`. `createRef` remains as-is — refs stay their own specialized store.

## Risks / Trade-offs

- [Positional rules are a new discipline for loom authors] → one rule, stated where the utility is documented, with the debug-lane overrun warning as the guardrail; `createRef` already imposed it silently.
- [Scope creep toward a hooks family] → non-goals fence it: one storage utility; reactivity stays activities' job.

## Migration Plan

Additive minor. The docs' Disclosure example gains the `own` variant; existing module-scope guidance remains valid for shared state.

## Open Questions

- Final name (D2) — settled at red-spec review.
