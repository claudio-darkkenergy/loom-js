# Hydration Event Replay

## Why

During the settle window the served markup is deliberately inert: listeners exist only on the detached client tree, so a `$click` button or intercepted form does nothing until the swap. Dehydrated state shrinks that window to roughly a macrotask in a well-wired app, and native anchors degrade gracefully — but an early click on framework-handled UI is still silently lost. The hydration docs review (2026-09-07) asked whether this is solvable rather than inherent: it is. Capture-and-replay is the established answer (React 18, Angular, Qwik), and loom's same-render-path guarantee makes the hard part — mapping a served node to its client twin — a trivial structural index path, no heuristics.

## What Changes

- `hydrate` gains opt-in **event replay**: `replayEvents?: boolean | string[]` (default off; `true` = a curated default set — `click` & `submit`; an array names event types explicitly).
- While enabled, hydration attaches **one capturing listener per replayed type on the root** for the settle window. Events landing on the served markup are recorded (target as a child-index path from the root, plus the event's constructor essentials) & `preventDefault`ed where replay requires it (`submit`, and `click` on non-anchor targets — native anchor navigation stays untouched: graceful degradation must survive replay being on).
- After the swap, recorded events re-dispatch in order to the corresponding nodes in the client tree, resolved by the same index path; a path that no longer resolves (tree divergence, `maxWait` expiry with pending work) drops that event with a `loom.console` warning instead of mis-targeting.
- Listeners & the queue are released at the swap (or on `hydrate`'s failure path) — nothing persists after boot.
- Docs: README Client Hydration + topic 11 — the pre-swap inertness bullet gains the opt-in, & The swap section notes replay timing (recorded pre-swap, dispatched after `onMounted`'s sweep so handlers observe a mounted tree).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `client-hydration`: adds the opt-in event-replay requirement (capture during the settle window, ordered re-dispatch post-swap, structural node mapping, anchor pass-through, drop-with-warning on unresolvable targets, zero cost when off).

## Impact

- `packages/core/src/hydrate.ts` (+ a small `lib/` replay module so `init`-only bundles tree-shake it with the rest of hydrate), `types.ts`.
- Tests: `packages/core/tests` hydrate specs (TDD — capture/replay ordering, anchor pass-through, off-by-default, unresolvable-path drop).
- README + topic 11 re-push; **minor** core changeset. Diagnostics lines adopt the `diagnostics-output-quality` anatomy if that lands first.
