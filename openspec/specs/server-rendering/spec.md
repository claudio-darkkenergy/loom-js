# server-rendering Specification

## Purpose

Defines how `@loom-js/core` renders an app to an HTML string outside a browser: the `@loom-js/core/server` entries — `renderToString` (async, the go-to) and `renderToStringSync` (the synchronous primitive) — render through the same code path the client runs, against a per-render injected DOM provider (e.g. linkedom), covering SSR (request-time) and SSG/prerender (build-time). Covers off-browser import safety, per-render isolation, browser-path neutrality, server lifecycle semantics, and route-aware rendering.

Established by the `add-server-rendering` change (2026-08-15). Route-aware rendering was added by the `unify-routing` change (2026-08-15). Client hydration of pre-rendered markup is now covered by the `client-hydration` capability (`renderToString` → `hydrate`, added by `add-client-hydration`, 2026-08-16); edge/worker delivery remains a future extension of this capability. The `unify-server-drain-on-settled` change (2026-08-18) replaced the async render's quiet-markup drain with the settlement signal `settled()` and `hydrate` consume, bounded by a `maxWait` option.

## Requirements

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

### Requirement: The core package is importable without a browser

Importing `@loom-js/core` SHALL NOT require browser globals at module-evaluation time, so isomorphic app code can load on a server before any render is requested.

#### Scenario: Bare import off-browser

- **WHEN** `@loom-js/core` is imported in a runtime with no `window`
- **THEN** module evaluation completes without error
- **AND** browser-coupled state (router location, history listeners) initializes lazily on first use instead

### Requirement: Rendering is isolated per render call

Server rendering SHALL resolve its DOM from a render-scoped provider, not a shared mutable global, so concurrent renders cannot corrupt each other.

#### Scenario: Concurrent renders do not interfere

- **WHEN** two server render calls run concurrently with different injected windows
- **THEN** each returns HTML consistent with its own input
- **AND** neither observes the other's DOM state

### Requirement: Browser rendering is unchanged and un-slowed

Introducing the provider seam SHALL NOT change client behavior or measurably regress the browser render path; in a browser the default provider resolves to the real `window`.

#### Scenario: Client render path unaffected

- **WHEN** an app renders in a real browser without an explicit provider
- **THEN** it uses the real `window`/`document`
- **AND** existing rendering, reconciliation, and lifecycle behavior is unchanged

### Requirement: Server-safe lifecycle semantics

Lifecycle behavior that assumes a live, connected document SHALL be defined for the server so client-only effects do not fire during SSR.

#### Scenario: Mount effects do not fire on the server

- **WHEN** an app with `onMounted` handlers is rendered via a server render entry
- **THEN** those handlers do not execute as if connected to a live browser document
- **AND** document-connectivity checks resolve against the injected document

#### Scenario: Per-render lifecycle registrations are released

- **WHEN** a server render call (`renderToString` or `renderToStringSync`) completes
- **THEN** lifecycle registrations created for that render's document are released, so repeated server renders do not accumulate registry entries

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
