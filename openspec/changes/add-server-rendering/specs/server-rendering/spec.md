## ADDED Requirements

### Requirement: Render a loom app to an HTML string outside a browser

The framework SHALL provide a server render entry that renders a loom app against an injected DOM provider and returns serialized HTML, without requiring a live browser.

#### Scenario: renderToString returns markup

- **WHEN** `renderToString(App(props), { window })` is called with a linkedom-backed `window`
- **THEN** it returns a string containing the app's rendered HTML
- **AND** it does not access browser globals directly (only the injected provider)

#### Scenario: Injected window is normalized

- **WHEN** the injected linkedom `window` lacks `NodeFilter`, `location`, or `history`
- **THEN** `renderToString` installs working stand-ins before rendering (`NodeFilter` constants, a plain-object `location`-like derived from the `url` option, a minimal `history` shim)

### Requirement: The core package is importable without a browser

Importing `@loom-js/core` SHALL NOT require browser globals at module-evaluation time, so isomorphic app code can load on a server before any render is requested.

#### Scenario: Bare import off-browser

- **WHEN** `@loom-js/core` is imported in a runtime with no `window`
- **THEN** module evaluation completes without error
- **AND** browser-coupled state (router location, history listeners) initializes lazily on first use instead

### Requirement: Rendering is isolated per render call

Server rendering SHALL resolve its DOM from a render-scoped provider, not a shared mutable global, so concurrent renders cannot corrupt each other.

#### Scenario: Concurrent renders do not interfere

- **WHEN** two `renderToString` calls run concurrently with different injected windows
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

- **WHEN** an app with `onMounted` handlers is rendered via `renderToString`
- **THEN** those handlers do not execute as if connected to a live browser document
- **AND** document-connectivity checks resolve against the injected document

#### Scenario: Per-render lifecycle registrations are released

- **WHEN** a `renderToString` call completes
- **THEN** lifecycle registrations created for that render's document are released, so repeated server renders do not accumulate registry entries
