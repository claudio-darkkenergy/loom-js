# app-prerendering Specification (delta)

## ADDED Requirements

### Requirement: Production builds emit prerendered HTML per route

The loom app's production build SHALL emit a fully rendered static `index.html` for the home route and for every published docs topic, produced by `renderToString` against a fresh injected window per route with the route's URL installed — the same render path the client runs.

#### Scenario: Home route prerendered

- **WHEN** the production build completes
- **THEN** `build/index.html` contains the rendered home markup inside the app root element, not an empty shell

#### Scenario: Docs topics prerendered

- **WHEN** the production build completes
- **THEN** every published topic slug has a `build/docs/<slug>/index.html` containing that topic's rendered content

### Requirement: Prerendered routes are discovered from the content source

The docs route set SHALL be enumerated at build time from the Contentful page listing (the same listing the side nav renders) — no hardcoded slug list in the build.

#### Scenario: New topic published

- **WHEN** a topic is added in Contentful and a build runs
- **THEN** the new topic's route is prerendered with no app code change

### Requirement: Prerendered output serializes settled content

Each prerendered route SHALL serialize settled content — the settlement wait ensures route pages, lazy imports, and resource-tracked data land before serialization. A route that cannot settle SHALL fail the build loudly rather than emit a skeleton.

#### Scenario: Content, not skeletons

- **WHEN** a docs topic route is prerendered
- **THEN** the emitted HTML contains the topic's actual content and no skeleton-loader markup

#### Scenario: Build-time data failure

- **WHEN** the content source is unreachable during prerender
- **THEN** the build fails with the error surfaced — it does not ship empty or error-state HTML

### Requirement: Each prerendered route embeds its dehydrated state

Each prerendered page SHALL embed the route's dehydrated resource state, serialized via `serializeState`, in the documented JSON script element — so the client can prime its resource cache before boot.

#### Scenario: State script present and safe

- **WHEN** a prerendered page is inspected
- **THEN** it contains a `script[type="application/json"]` state element whose payload `JSON.parse`s to the route's resource values, serialized through `serializeState` (never raw `JSON.stringify`)
