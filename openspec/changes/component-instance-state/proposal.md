# Component Instance State

## Why

A locally defined activity looks like per-instance state but isn't quite: the render function re-runs on a _parent-triggered_ re-render, recreating the activity and resetting it (verified empirically 2026-09-07 while documenting the component-scoped-state example — its "boundary" paragraph documents the limitation this change would lift). Components that both receive changing props and hold instance state currently have no correct local option; the docs' answer is "move it to module scope," which sacrifices per-instance-ness. Core already owns the solving mechanism: `createRef` is call-order-memoized per component context (`memoizedRefContext` replays cached refs across re-renders) — this change generalizes that machinery to arbitrary values.

## What Changes

- The render function's props gain an instance-memo utility (name settled in design; working shape `own<T>(create: () => T): T`): first render invokes `create` and caches per context in call order; re-renders replay the cached value — so `const isOpen = own(() => activity(false))` survives parent re-renders.
- Call-order discipline documented (same rule `createRef` already implicitly has, and hooks users know): call unconditionally, same order every render.
- Docs: the component-scoped-state example gains the surviving variant; the boundary paragraph is rewritten from "limitation" to "choose your scope"; Built-in props section (via `document-component-refs`) lists the new utility.
- Non-breaking, additive; tree-shakes to nothing for non-users if implementation allows.

## Capabilities

### New Capabilities

- `component-instance-state`: the instance-memo contract — creation on first render, replay across re-renders, per-instance isolation, call-order rules, unmount lifetime, SSR/window isolation.

### Modified Capabilities

_None._

## Impact

- `packages/core/src/component.ts` + `lib/context` — generalize the ref-iterator memoization; `UtilityProps` grows the utility.
- `packages/core/tests/unit` — instance-survival specs (the probe from 2026-09-07 becomes the red test), isolation between instances, call-order misuse behavior.
- README + activities/components topics + `document-component-refs`'s Built-in props section — coordinated docs.
- Published: `@loom-js/core` **minor** changeset.
- No urgency gate — motivated by API completeness, not a blocked consumer; pairs naturally after `activity-transform-concurrency` (both touch the state story the docs tell).
