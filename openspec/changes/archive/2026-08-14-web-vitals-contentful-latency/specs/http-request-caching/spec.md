# http-request-caching Specification (delta)

## ADDED Requirements

### Requirement: Adapter failures produce uncached error results

`request` SHALL run body parsing and the caller-supplied `adapter` inside its error guard: an adapter that throws (e.g. rejecting a semantically-failed 2xx response such as a GraphQL error envelope) SHALL yield an error result carrying the response's HTTP status, and that result SHALL NOT be cached — the next identical call retries.

#### Scenario: Adapter throw is returned as an error result

- **WHEN** the response is 200 but the adapter throws while adapting the body
- **THEN** `request` resolves (does not reject) with `{ error, status: 200 }` and no cache entry is written

#### Scenario: Retry after adapter failure

- **WHEN** the same request is issued again after an adapter failure
- **THEN** the underlying fetch executes again rather than serving a cached result
