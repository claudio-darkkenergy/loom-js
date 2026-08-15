## ADDED Requirements

### Requirement: Server rendering is route-aware

An app whose routing is registered via `createRoutes` SHALL be importable and renderable through `renderToString`, with route matching driven by the injected location.

#### Scenario: Route-table apps import and render off-browser

- **WHEN** an app registers routes via `createRoutes` (including at module scope) and is rendered with `renderToString(app, { window, url })`
- **THEN** importing the app off-browser does not throw
- **AND** the router matches the route derived from `url` (observable via `watchRoute`/`routeEffect` during the render)

#### Scenario: Lazily-imported page content resolves per the settle policy

- **WHEN** the matched route's content comes from an async importer (`() => import(...)`)
- **THEN** the serialized output follows the settle policy this change defines (see design "Open question: async route content vs synchronous serialize") — either the content is awaited into the markup via the sanctioned async path, or the documented synchronous fallback renders in its place
