## MODIFIED Requirements

### Requirement: Production builds emit prerendered HTML per route

The loom app's production build SHALL emit a fully rendered static `index.html` for the home route, for `/benchmarks`, and for every published docs topic, produced by `renderToString` against a fresh injected window per route with the route's URL installed — the same render path the client runs.

#### Scenario: Home route prerendered

- **WHEN** the production build completes
- **THEN** `build/index.html` contains the rendered home markup inside the app root element, not an empty shell

#### Scenario: Docs topics prerendered

- **WHEN** the production build completes
- **THEN** every published topic slug has a `build/docs/<slug>/index.html` containing that topic's rendered content

#### Scenario: Benchmarks route prerendered

- **WHEN** the production build completes
- **THEN** `build/benchmarks/index.html` contains the rendered comparison tables with measured values, not an empty shell or skeleton

### Requirement: Prerendered output serializes settled content

Each prerendered route SHALL serialize settled content — the settlement wait ensures route pages, lazy imports, and resource-tracked data land before serialization. A route that cannot settle SHALL fail the build loudly rather than emit a skeleton. The `/benchmarks` route SHALL settle from the bench results the build runner seeds into the prerender bundle, and its output SHALL be validated to contain every measured framework's name and the `bench:results` state key.

#### Scenario: Content, not skeletons

- **WHEN** a docs topic route is prerendered
- **THEN** the emitted HTML contains the topic's actual content and no skeleton-loader markup

#### Scenario: Build-time data failure

- **WHEN** the content source is unreachable during prerender
- **THEN** the build fails with the error surfaced — it does not ship empty or error-state HTML

#### Scenario: Benchmarks render from seeded results

- **WHEN** `/benchmarks` is prerendered
- **THEN** the runner has seeded `apps/bench/results/latest.json` into the prerender bundle, the HTML names every framework in the results, and the dehydrated state contains `bench:results`

#### Scenario: Missing results fail the build

- **WHEN** `apps/bench/results/latest.json` is absent or invalid at prerender time
- **THEN** the build fails naming the file — it does not ship a benchmarks page without numbers
