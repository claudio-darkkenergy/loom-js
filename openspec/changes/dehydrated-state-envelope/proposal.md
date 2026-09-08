# Dehydrated State Envelope

## Why

`primeResources` accepts any parsed object, so nothing distinguishes state produced by `serializeState` from a hand-rolled `JSON.stringify` — the exact path the docs call out as an XSS footgun (`</script>` smuggled through content). A client-side check can't prevent that breakout (it executes at HTML parse time, and a breakout attacker forges any marker), but it can catch the _misuse_ the moment it happens: refuse to prime a payload the helper didn't produce, warn in dev, and boot unprimed. Maintainer direction from the dehydrated-state docs review (2026-09-08): format validation as a misuse guard, explicitly not a trust layer. A versioned envelope also buys forward compatibility for the state format.

## What Changes

- `serializeState` wraps its output in a versioned envelope — `{ __loom: 1, state: <DehydratedState> }` — same script-safe escaping, still plain `JSON.parse`-able.
- `primeResources` verifies the envelope: a well-formed version-1 payload primes as today; a bare/unmarked object primes **nothing**, warns (`loom.console`) that the payload wasn't produced by `serializeState` & points at the helper; an unknown _higher_ version also skips with a warning (fail-safe: unprimed keys just fetch — the app boots correctly either way).
- Docs: the topic/README client snippet is unchanged in shape (`primeResources(JSON.parse(...))`); the XSS-footgun line gains the enforcement sentence (hand-rolled payloads don't prime & warn); README + topic 12 re-push.
- **Behavior change**: only for callers hand-feeding `primeResources` un-enveloped objects — which is the misuse being guarded. Pre-1.0 **minor** changeset, loud description.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dehydrated-state`: the serialize helper emits a versioned envelope; priming validates it, primes only recognized payloads, and degrades to unprimed boot with a warning otherwise.

## Impact

- `packages/core/src/dehydrate.ts` (`serializeState`), `packages/core/src/resource.ts` (`primeResources`), `types.ts` (envelope type).
- Server & client helpers ship in one package, so no version-skew surface beyond the guarded one.
- Tests (TDD), README + topic 12, **minor** changeset. Warning adopts the `diagnostics-output-quality` anatomy if that lands first; `server-first-loom-app`'s prerender pipeline inherits the envelope transparently (it already uses `serializeState`).
