# Design — dehydrated-state-envelope

## Context

`serializeState(state)` escapes `<`/U+2028/U+2029 and returns a JSON string; clients `JSON.parse` the embedded script's text and hand the object to `primeResources`, which seeds the per-window cache. Nothing validates provenance or format version. The docs review established the threat framing: the breakout executes at HTML parse time, so client checks are misuse detection, never XSS defense — the escaping in `serializeState` remains the only real guard, and this change exists to keep people on it.

## Goals / Non-Goals

**Goals:** hand-rolled payloads visibly fail to prime at first dev run; unknown future formats degrade safely; the format carries a version from here on.

**Non-Goals:** any security/trust claim (documented as explicitly not that); accepting legacy bare payloads (grandfathering them would erase the guard); signing/integrity schemes.

## Decisions

### D1 — Envelope shape: `{ __loom: 1, state }`

A wrapper object rather than an injected key inside the state: keys inside `DehydratedState` are resource keys, and reserving one would carve a hole in the key namespace. `__loom` is the version number itself — one field does provenance & versioning.

### D2 — Validation outcomes in `primeResources`

Version 1 with an object `state` → prime. Anything else → prime nothing + one warning naming what was received & the remedy ("embed through `serializeState`"); unknown higher versions get the version-mismatch wording instead. Both paths return normally — the boot continues unprimed, and unprimed keys already fetch correctly (existing requirement).

### D3 — Type surface says envelope, runtime double-checks

`primeResources(payload: SerializedStateEnvelope)` — the type steers correct use at compile time; the runtime check catches the untyped/JSON path, which is precisely where hand-rolling happens.

## Risks / Trade-offs

- [Someone's working hand-rolled-but-safe pipeline stops priming] → the warning names the one-line fix; wrapping in the envelope by hand also works and is fine — the guard is about defaults, not gatekeeping.
- [Envelope mistaken for a security feature] → docs sentence states the boundary in both directions (escaping is the defense; the envelope is a seatbelt reminder).

## Migration Plan

One minor release; server & client halves ship together. No stored-state migration surface (state lives per-served-page, never persisted).

## Open Questions

None.
