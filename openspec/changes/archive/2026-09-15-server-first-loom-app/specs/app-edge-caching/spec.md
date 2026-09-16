# app-edge-caching Specification (delta)

## ADDED Requirements

### Requirement: Prerendered routes are served as CDN static output

Prerendered routes SHALL be served as static files from the CDN — a request for `/` or a published `/docs/<slug>` resolves to its prerendered `index.html` without invoking a function or a blanket SPA rewrite. Unknown paths SHALL still fall back to the SPA shell.

#### Scenario: Topic served statically

- **WHEN** a published topic URL is requested in production
- **THEN** the response is that topic's prerendered static HTML (rendered content in the body), not the empty SPA shell

#### Scenario: Unknown path falls back

- **WHEN** a path with no prerendered file is requested
- **THEN** the SPA-fallback shell is served and the client router resolves it

### Requirement: Cache lifetimes match asset mutability

Hashed JS/CSS assets SHALL be immutable-cacheable; prerendered HTML SHALL be cached at the edge until the next deploy invalidates it. HTML SHALL NOT be cached in a way a deploy cannot invalidate.

#### Scenario: Deploy refreshes HTML

- **WHEN** a new deploy completes
- **THEN** subsequent requests receive the new prerendered HTML, while unchanged hashed assets may continue serving from cache

### Requirement: Content publishes trigger a rebuild

A Contentful publish or unpublish of docs content SHALL trigger a production rebuild (webhook → deploy hook), so SSG output tracks the content source without manual deploys. On-demand per-route regeneration (ISR) is the recorded future evolution via the reusable prerender entry point; until then freshness is deploy-grained.

#### Scenario: Publish propagates

- **WHEN** an editor publishes a docs topic change in Contentful
- **THEN** a rebuild is triggered automatically and the updated content is live once it completes

#### Scenario: ISR seam preserved

- **WHEN** the prerender implementation is inspected
- **THEN** per-route rendering is exposed as a reusable entry (route in, html + state out) that a future on-demand regeneration function can call unchanged
