## MODIFIED Requirements

### Requirement: Prerendered routes are served as CDN static output

Prerendered routes SHALL be served as static files from the CDN — a request for `/`, `/benchmarks` or a published `/docs/<slug>` resolves to its prerendered `index.html` without invoking a function or a blanket SPA rewrite. Unknown paths SHALL still fall back to the SPA shell.

#### Scenario: Topic served statically

- **WHEN** a published topic URL is requested in production
- **THEN** the response is that topic's prerendered static HTML (rendered content in the body), not the empty SPA shell

#### Scenario: Benchmarks served statically

- **WHEN** `/benchmarks` is requested in production
- **THEN** the response is the prerendered benchmarks HTML with the measured values in the body, not the SPA shell

#### Scenario: Unknown path falls back

- **WHEN** a path with no prerendered file is requested
- **THEN** the SPA-fallback shell is served and the client router resolves it

### Requirement: Cache lifetimes match asset mutability

Hashed JS/CSS assets SHALL be immutable-cacheable, including the `benchmarks` route chunk prefix; prerendered HTML SHALL be cached at the edge until the next deploy invalidates it. HTML SHALL NOT be cached in a way a deploy cannot invalidate. `static/bench/latest.json` is unhashed and SHALL NOT be immutable-cacheable.

#### Scenario: Deploy refreshes HTML

- **WHEN** a new deploy completes
- **THEN** subsequent requests receive the new prerendered HTML, while unchanged hashed assets may continue serving from cache

#### Scenario: Benchmarks chunk is immutable

- **WHEN** the `benchmarks-<hash>.js` route chunk is requested
- **THEN** the response carries `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: Results file refreshes with a deploy

- **WHEN** a deploy ships new bench results
- **THEN** a request for `/static/bench/latest.json` after the deploy returns the new values
