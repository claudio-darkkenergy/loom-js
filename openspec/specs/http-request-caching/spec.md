## Purpose

Defines the caching and deduplication contract for `@loom-js/utils`' `request` helper: successful responses are cached per request signature for the session's lifetime (error results are never cached), a caller-supplied `cacheKey` — which is excluded from the signature — busts the cached entry when any of its values change, and concurrent calls with the same signature share a single in-flight fetch whose registry entry is removed once the flight settles.

This capability covers `lib/utils/src/http/request.ts` and everything layered on it (`graphQlRequest`, the Contentful providers in `apps/loom`). Cache TTL/expiry and purge APIs are future work.

## Requirements

### Requirement: Successful responses are cached per request signature

`request` SHALL cache the adapted result of a successful response keyed by the full request signature and serve repeat calls with the same signature from that cache without fetching. Error results SHALL NOT be cached.

#### Scenario: Repeat call is served from cache

- **WHEN** `request` is called twice sequentially with an identical input and init
- **THEN** the underlying fetch executes once and both calls resolve with the same data

#### Scenario: Failed responses are retried

- **WHEN** a call fails (non-ok response) and the same request is issued again
- **THEN** the second call fetches again rather than serving the failure from cache

### Requirement: Adapter failures produce uncached error results

`request` SHALL run body parsing and the caller-supplied `adapter` inside its error guard: an adapter that throws (e.g. rejecting a semantically-failed 2xx response such as a GraphQL error envelope) SHALL yield an error result carrying the response's HTTP status, and that result SHALL NOT be cached — the next identical call retries.

#### Scenario: Adapter throw is returned as an error result

- **WHEN** the response is 200 but the adapter throws while adapting the body
- **THEN** `request` resolves (does not reject) with `{ error, status: 200 }` and no cache entry is written

#### Scenario: Retry after adapter failure

- **WHEN** the same request is issued again after an adapter failure
- **THEN** the underlying fetch executes again rather than serving a cached result

### Requirement: A changed cacheKey busts the cached entry

When a caller supplies `cacheKey`, `request` SHALL compare it element-wise against the stored key for that signature and re-fetch when any element differs (or the length changed); an unchanged `cacheKey` SHALL serve from cache.

#### Scenario: Changed key re-fetches

- **WHEN** a cached request is repeated with a `cacheKey` whose element value changed
- **THEN** the fetch executes again and the cache holds the new result

#### Scenario: Unchanged key stays cached

- **WHEN** a cached request is repeated with an identical `cacheKey`
- **THEN** no fetch executes and the cached data is returned

### Requirement: Concurrent identical requests share one flight

Calls with the same signature made while a fetch is in flight SHALL await that same fetch — no additional network request, no cancellation of the first caller — and all callers SHALL resolve with the same result. The in-flight registry SHALL drop the entry once the flight settles.

#### Scenario: Two concurrent callers, one fetch

- **WHEN** two `request` calls with the same signature start before the first resolves
- **THEN** the underlying fetch executes exactly once
- **AND** both callers resolve with the same successful data (neither receives a cancellation error)

#### Scenario: Registry is clean after settling

- **WHEN** a shared flight resolves or rejects
- **THEN** a subsequent call with the same signature (cache permitting) starts a fresh fetch rather than awaiting a stale flight
