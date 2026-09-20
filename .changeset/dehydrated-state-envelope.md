---
'@loom-js/core': minor
---

Dehydrated state ships in a versioned envelope, and priming now requires it:

- `serializeState` wraps its output as `{ __loom: 1, state }` — same script-safe escaping, still plain `JSON.parse`-able; `primeResources(JSON.parse(...))` pipelines need no shape change.
- **Behavior change:** `primeResources` primes nothing from a payload without the envelope (or with a version it doesn't read) — one console warning names the problem and the boot proceeds unprimed, so every key just fetches. This only affects callers hand-feeding bare objects, which is the misuse being guarded: hand-rolling `JSON.stringify` into inline HTML is the documented XSS footgun. The envelope is misuse detection, not a trust layer — `serializeState`'s escaping remains the XSS defense.
- New exported type: `SerializedStateEnvelope` (the parsed form of `serializeState`'s output, now `primeResources`'s parameter type).
