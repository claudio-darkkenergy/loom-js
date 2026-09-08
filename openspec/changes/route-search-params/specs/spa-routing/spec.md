## ADDED Requirements

### Requirement: The route value exposes search params

`RouteValue` SHALL expose a `searchParams` getter returning a `URLSearchParams` consistent with the route's `raw.search` — constructed lazily on access, with each access returning a fresh instance so no consumer's mutation is observable by another.

#### Scenario: query is readable everywhere the route value flows

- **WHEN** a route effect, watcher, guard, or page (`routeProps`) reads `searchParams` after a navigation carrying a query string
- **THEN** the returned `URLSearchParams` reflects that query

#### Scenario: unread means unconstructed

- **WHEN** a consumer never accesses `searchParams`
- **THEN** no `URLSearchParams` is constructed for that consumer

#### Scenario: accesses are isolated

- **WHEN** one consumer mutates the `URLSearchParams` it received
- **THEN** other consumers' accesses are unaffected
