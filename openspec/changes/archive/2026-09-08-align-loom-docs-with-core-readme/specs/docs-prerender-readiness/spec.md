# docs-prerender-readiness Specification (delta)

## ADDED Requirements

### Requirement: Docs components serialize under renderToString

New and modified docs-app components SHALL render under `renderToString` against an injected (linkedom) window. App code SHALL NOT reference bare `window`/`document` globals at module scope or during the render phase — core resolves the DOM through its internal provider seam and never patches `globalThis`, so bare-global access throws server-side. Browser-only APIs (`matchMedia`, `localStorage`, observers, measurement) SHALL be confined to `onMounted` and event handlers, which never execute on the server.

#### Scenario: Server render succeeds

- **WHEN** a docs topic view is rendered via `renderToString` with a linkedom window and a `/docs/<slug>` URL
- **THEN** it serializes the topic markup without throwing on missing browser globals

#### Scenario: Browser-only work is deferred

- **WHEN** a docs component needs a browser-only API
- **THEN** the call sites live in `onMounted` or event handlers, not at module scope or in the render path

### Requirement: Docs content loads through the keyed resource cache

Docs and home content fetches SHALL route through core's `resource(key, fetcher)` inside activity transforms, with stable, deterministic keys — so the settlement signal tracks them (`renderToString` serializes settled content, not skeletons) and `dehydrate()` can capture their values for client priming.

#### Scenario: Fetches are capturable

- **WHEN** a docs route is server-rendered and the window is passed to `dehydrate()`
- **THEN** the route's content values appear in the dehydrated state under their resource keys

#### Scenario: Primed client skips the network

- **WHEN** the client's resource cache is primed with a route's dehydrated state before boot
- **THEN** that route's first render resolves content from the primed cache without invoking the fetchers

### Requirement: Topic slugs are permanent

Published topic slugs SHALL be treated as immutable identifiers — under prerendering they become physical static paths. Renaming a topic SHALL keep the old slug resolving via an explicit redirect recorded alongside the content map.

#### Scenario: Slug rename

- **WHEN** a published topic's slug must change
- **THEN** the change ships a redirect from the old slug and the content map records both
