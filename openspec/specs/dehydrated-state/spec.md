# dehydrated-state Specification

## Purpose

Defines the server-to-client state handoff for pre-rendered loom pages: a per-window keyed resource cache (`resource`) as the interception seam for app data fetches, server-side capture of a render's settled resource values (`dehydrate`), a script-safe serializer for embedding that state in HTML (`serializeState`), and boot-time priming of the client cache (`primeResources`) so primed fetches never hit the network and hydration settles from local data. Transport is explicit — the consumer embeds and reads back the state; loom never writes or discovers page structure.

Established by the `add-dehydrated-state` change (2026-08-16). Automatic script-tag embed/discovery and cache TTL/invalidation semantics remain future extensions; freshness is expressed through keys.

## Requirements

### Requirement: A keyed resource cache memoizes async work per window

The framework SHALL provide a resource primitive taking a string key and an async fetcher that memoizes per key, scoped per window through the DOM provider seam: the first call for a key invokes the fetcher, concurrent callers share the in-flight promise, and later calls resolve from the cached result without invoking the fetcher again. A rejected fetch SHALL reject its in-flight callers and SHALL NOT be cached, so a subsequent call retries.

#### Scenario: One fetch per key

- **WHEN** the resource is requested twice for the same key in the same window, sequentially or concurrently
- **THEN** the fetcher runs exactly once and both callers resolve with the same value

#### Scenario: Rejection is retryable

- **WHEN** a key's fetcher rejects and the resource is requested again for that key
- **THEN** the first caller receives the rejection and the second call invokes the fetcher anew

#### Scenario: Windows are isolated

- **WHEN** the same key is requested under two different provider windows
- **THEN** each window runs its own fetch and holds its own cached value

### Requirement: Dehydration captures a window's settled resource values

The framework's server entry SHALL provide a dehydrate step that, given a render's window, returns a plain JSON-serializable object mapping each settled resource key to its value. Pending (unsettled) entries SHALL be skipped, and entries whose values cannot be serialized SHALL be skipped with a debug-gated console warning — a skipped entry degrades to a client-side cache miss, never an error.

#### Scenario: Settled values round-trip

- **WHEN** a server render resolves resources for keys and dehydrate is called with that render's window
- **THEN** the returned object contains those keys with their settled values and survives `JSON.stringify`/`JSON.parse` unchanged

#### Scenario: Unserializable entries degrade to a miss

- **WHEN** a settled resource value cannot be JSON-serialized
- **THEN** dehydrate omits that key, warns through the framework console, and still returns the remaining entries

### Requirement: Priming seeds the client cache before boot

The framework SHALL provide a prime step that, given a dehydrated state object, seeds the current window's resource cache so that a subsequent resource call for a primed key resolves with the primed value without ever invoking its fetcher. Priming SHALL work ahead of any boot entry — `hydrate` and `init` alike — and unprimed keys SHALL fetch exactly as before.

#### Scenario: Primed keys skip the network

- **WHEN** the prime step runs with a state object and the app then requests a primed key
- **THEN** the call resolves with the primed value and the fetcher is never invoked

#### Scenario: Unprimed keys still fetch

- **WHEN** the app requests a key absent from the primed state
- **THEN** the fetcher runs exactly as it would without priming

#### Scenario: Primed hydration settles without fetching

- **WHEN** a page is served with dehydrated state, the client primes it, and `hydrate` boots an app whose transforms resolve their data through primed resource keys
- **THEN** the swap completes without any fetcher being invoked and the final DOM matches the served markup

### Requirement: Embeddable serialization is script-safe

The framework's server entry SHALL provide a serialize helper producing a JSON string safe to inline inside an HTML script element: sequences that could terminate the element or break parsing (`<`, U+2028, U+2029) SHALL be escaped, and the output SHALL parse back to the original state with `JSON.parse`.

#### Scenario: Script-breaking content is neutralized

- **WHEN** a dehydrated value contains `</script>` or paragraph/line separator characters and the helper serializes the state
- **THEN** the output contains no unescaped `<` and `JSON.parse` of it reproduces the original value exactly
