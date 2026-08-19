## MODIFIED Requirements

### Requirement: Render a loom app to an HTML string outside a browser

The framework SHALL provide two server render entries that render a loom app against an injected DOM provider and produce serialized HTML, without requiring a live browser: `renderToString` (async — the go-to; awaits the settlement signal so framework-tracked async work serializes before the markup is captured) and `renderToStringSync` (the synchronous primitive; serializes only what settled during the app's synchronous work).

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

### Requirement: Server rendering is route-aware

An app whose routing is registered via `createRoutes` SHALL be importable and renderable through the server render entries, with route matching driven by the injected location.

#### Scenario: Route-table apps import and render off-browser

- **WHEN** an app registers routes via `createRoutes` (including at module scope) and is rendered with either server entry and a `url`
- **THEN** importing the app off-browser does not throw
- **AND** the router matches the route derived from `url` (observable via `watchRoute`/`routeEffect` during the render)

#### Scenario: Lazily-imported page content resolves per the settle policy

- **WHEN** the matched route's content comes from an async importer (`() => import(...)`)
- **THEN** the async `renderToString` awaits the settlement signal — the same per-window pending-work counter `settled()` and `hydrate` consume — and serializes the page content in place, regardless of how many macrotasks the import chain spans
- **AND** `renderToStringSync` serializes the shell/fallback in its place, documented as the synchronous contract

## ADDED Requirements

### Requirement: The async render's settlement wait is bounded

`renderToString` SHALL bound its settlement wait with a `maxWait` option (milliseconds, default `4000`, `Infinity` to disable), symmetric with `hydrate`'s bound: framework-tracked async work that outlives the bound does not hang the render.

#### Scenario: Slow tracked work serializes fully within the bound

- **WHEN** an activity transform awaits async work that takes multiple macrotask hops to resolve (e.g. real I/O), and it settles within `maxWait`
- **THEN** `renderToString` serializes the transform's landed content — not the fallback that was in the markup while the work was pending

#### Scenario: Expiry serializes what has landed, with a warning

- **WHEN** tracked async work is still pending when `maxWait` elapses
- **THEN** `renderToString` resolves with the markup that has landed so far
- **AND** warns via the framework console (debug-gated, as `hydrate`'s expiry warning is), naming the elapsed bound and the pending operation count

#### Scenario: The bound can be disabled

- **WHEN** `maxWait: Infinity` is passed
- **THEN** the render waits for settlement indefinitely
