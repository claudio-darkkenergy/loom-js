<!-- Naming revised at apply review (2026-08-15), before first publish: the async render owns the unmarked name `renderToString` (the recommended path — it settles route/lazy-import content); the synchronous primitive is `renderToStringSync`, per Node's `readFile`/`readFileSync` convention. Neither name had ever shipped, so the swap is not a rename of a published API. -->

## MODIFIED Requirements

### Requirement: Render a loom app to an HTML string outside a browser

The framework SHALL provide two server render entries that render a loom app against an injected DOM provider and produce serialized HTML, without requiring a live browser: `renderToString` (async — the go-to; drains settled route/lazy-import work before serializing) and `renderToStringSync` (the synchronous primitive; serializes only what settled during the app's synchronous work).

#### Scenario: renderToString resolves markup

- **WHEN** `await renderToString(App(props), { window })` is called with a linkedom-backed `window`
- **THEN** it resolves a string containing the app's rendered HTML
- **AND** it does not access browser globals directly (only the injected provider)

#### Scenario: renderToStringSync returns markup synchronously

- **WHEN** `renderToStringSync(App(props), { window })` is called
- **THEN** it synchronously returns the markup that settled during the app's synchronous work

#### Scenario: Injected window is normalized

- **WHEN** the injected linkedom `window` lacks `NodeFilter`, `location`, or `history`
- **THEN** the render entries install working stand-ins before rendering (`NodeFilter` constants, a plain-object `location`-like derived from the `url` option, a minimal `history` shim)

## ADDED Requirements

### Requirement: Server rendering is route-aware

An app whose routing is registered via `createRoutes` SHALL be importable and renderable through the server render entries, with route matching driven by the injected location.

#### Scenario: Route-table apps import and render off-browser

- **WHEN** an app registers routes via `createRoutes` (including at module scope) and is rendered with either server entry and a `url`
- **THEN** importing the app off-browser does not throw
- **AND** the router matches the route derived from `url` (observable via `watchRoute`/`routeEffect` during the render)

#### Scenario: Lazily-imported page content resolves per the settle policy

- **WHEN** the matched route's content comes from an async importer (`() => import(...)`)
- **THEN** the async `renderToString` drains the settled route/lazy-import work (bounded, until the markup goes quiet) and serializes the page content in place
- **AND** `renderToStringSync` serializes the shell/fallback in its place, documented as the synchronous contract
