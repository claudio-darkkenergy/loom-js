# route-asset-preload Specification

## Purpose

Defines core's contract for loading per-route assets (stylesheets) before a lazily-imported route renders: the optional `assets` map on `createRoutes`, concurrent loading with the chunk import, render gating, idempotency by document link, degrade-on-failure, and the server no-op.

Established by the `route-scoped-css-delivery` change (2026-09-19).

## Requirements

### Requirement: createRoutes accepts per-route asset URLs

`createRoutes` SHALL accept an optional `assets` map from route pattern to a list of stylesheet URLs, keyed identically to `config`. Omitting `assets`, or omitting a route from it, SHALL leave that route's behavior exactly as today. Core SHALL treat the values as opaque URLs — no bundler- or manifest-specific knowledge.

#### Scenario: Assets option is optional and non-breaking

- **WHEN** an app calls `createRoutes({ config })` with no `assets`
- **THEN** routing, lazy import, and rendering behave identically to the previous release

#### Scenario: Unlisted route is unaffected

- **WHEN** `assets` is provided but has no entry for the matched route
- **THEN** the route imports and renders with no asset-loading step

### Requirement: Route assets are loaded before the route renders

When a route with declared assets is matched, the router SHALL load its stylesheet URLs concurrently with the route's dynamic import and SHALL render the route's content only after both the import and the asset loads have settled.

#### Scenario: No flash of unstyled content on SPA navigation

- **WHEN** the user client-side navigates to a route whose CSS is not yet in the document
- **THEN** a `link[rel="stylesheet"]` for each declared URL is appended to the owner document's head, and the route's content is not mounted until those links have settled

#### Scenario: Asset loading does not serialize with the chunk import

- **WHEN** a route with declared assets is matched
- **THEN** the stylesheet request(s) and the chunk request are in flight concurrently, not sequentially

### Requirement: Asset loading is idempotent per document

A declared URL already present as a stylesheet link in the owner document SHALL NOT be injected again; it SHALL count as loaded immediately. Repeat navigations to the same route SHALL NOT re-inject or re-await its assets.

#### Scenario: Hard load with shell-linked CSS

- **WHEN** the user hard-loads a route whose shell HTML already links that route's CSS
- **THEN** no duplicate `link` element is created and rendering is not delayed by an extra stylesheet round trip

#### Scenario: Return navigation

- **WHEN** the user navigates away from and back to a route in one session
- **THEN** the second visit performs no stylesheet injection or network request for that route's CSS

### Requirement: Asset failures degrade, never block

A stylesheet that fails to load (error event) SHALL resolve the asset wait rather than reject it, after reporting through the framework's debug logging. The server runtime (no window/document) SHALL skip asset loading entirely.

#### Scenario: Stylesheet 404 still navigates

- **WHEN** a declared stylesheet URL returns an error at navigation time
- **THEN** the route's content still renders once its chunk resolves, and the failure is visible in debug logging

#### Scenario: Server render ignores assets

- **WHEN** routes with declared assets are rendered in the server runtime
- **THEN** no asset loading is attempted and rendering proceeds as before
