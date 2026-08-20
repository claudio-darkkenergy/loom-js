<!-- Widens spa-routing beyond its deliberately narrow first scope (link-activation policy) to the unified routing pipeline. -->

## ADDED Requirements

### Requirement: Location reactivity requires no route table

The router SHALL expose zero-config subscriptions to raw `Location` changes — an effect form (`locationEffect`) and a watcher form (`watchLocation`) — that emit without any route table being registered.

#### Scenario: locationEffect renders without createRoutes

- **WHEN** an app that never calls `createRoutes` renders `locationEffect(({ value: location }) => ...)`
- **THEN** the effect runs with the current `Location` and re-runs on every navigation

#### Scenario: watchLocation observes navigation without createRoutes

- **WHEN** `watchLocation(handler)` is registered and a navigation occurs
- **THEN** the handler is called with the new `Location`
- **AND** no route table was required

### Requirement: One history pipeline per window

All routing reactivity for a given window SHALL flow through a single layered pipeline — one history listener feeding a raw location activity, whose match transform feeds the route activity — with no parallel routing state.

#### Scenario: Location and route subscribers observe the same navigation

- **WHEN** a navigation occurs while both a location-layer subscriber (`locationEffect`/`watchLocation`) and a route-layer subscriber (`routeEffect`/`watchRoute`) are registered
- **THEN** both observe it, sourced from the same pipeline (the route layer contingent on a route-table match)

#### Scenario: The legacy routing module is removed

- **WHEN** a consumer imports `router`, `onRoute`, or `onRouteUpdate` from the package
- **THEN** the import fails — the exports were removed pre-1.0 without a deprecation bridge, replaced by `locationEffect`, `route`, and `watchLocation` respectively

### Requirement: The router instance is scoped to the rendering window

Router state SHALL be keyed by the resolved provider window: one instance per window, created lazily, never shared across windows.

#### Scenario: Browser has exactly one router

- **WHEN** routing APIs are used in a browser across multiple components and renders
- **THEN** they all resolve the same router instance for the lifetime of the page

#### Scenario: Server renders are isolated

- **WHEN** two server renders run with different injected windows and different request URLs
- **THEN** each resolves its own router instance and matches its own URL
- **AND** neither observes the other's location or subscriptions

### Requirement: Route registration is DOM-free at call time

`createRoutes` SHALL capture the route table without touching the DOM, so calling it at module scope is safe in any runtime; history wiring defers to first use inside a DOM scope.

#### Scenario: Module-scope createRoutes off-browser

- **WHEN** a module calls `createRoutes({ config })` at import time in a runtime with no `window`
- **THEN** the import completes without error

#### Scenario: Late-constructed router sees the captured table

- **WHEN** the table was captured at import time and a router is first constructed later (e.g. inside a server render scope)
- **THEN** route matching uses the captured table immediately

#### Scenario: Repeat registration replaces the table

- **WHEN** `createRoutes` is called a second time
- **THEN** the new table replaces the previous one for subsequent matching
