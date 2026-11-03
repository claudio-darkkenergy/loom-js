# build-tool-prerender Specification

## Purpose

The build tool's prerender phase: how `loom build` renders configured routes into their shells at build time, which hooks the app supplies, and how the output is checked.

## Requirements

### Requirement: The prerender phase is a tool-owned pipeline with app hooks

When `prerender` is configured, a production `loom build` SHALL add `prerender.entry` to the client build as `static/js/prerender`, load it from `outDir` after bundling, and for every route returned by `prerender.routes(bundle)`: render through the bundle's `prerenderRoute(url, window)` against a fresh `linkedom` window, run `prerender.validate`, inject markup and state into the route's shell through the core boot contract, and write `<outDir>/<route>/index.html`. `prerender.setup(bundle)` SHALL run once before enumeration and `prerender.after({ outDir, bundle })` once after every route is written.

#### Scenario: Routes enumerated by the app

- **WHEN** `prerender.routes` returns `['/', '/docs/a', '/docs/b']`
- **THEN** `index.html`, `docs/a/index.html` and `docs/b/index.html` carry rendered markup and a populated state script, and no other route is rendered

#### Scenario: Validation failure fails the build

- **WHEN** `prerender.validate` throws for a route
- **THEN** `loom build` exits non-zero with that error and does not emit the route

#### Scenario: Missing render export

- **WHEN** the prerender entry does not export `prerenderRoute`
- **THEN** the build fails naming the missing export before any route is rendered

#### Scenario: Dev never prerenders

- **WHEN** `loom dev` runs with `prerender` configured
- **THEN** no prerender bundle is loaded and shells keep empty boot slots

### Requirement: Pristine shells are preserved for fallback serving

Before any injection, the tool SHALL copy the root shell to `<outDir>/shell.html` and leave each non-root route's own `index.html` shell uninjected unless that exact route is prerendered, so unknown paths and unknown sub-routes boot the client without stale markup.

#### Scenario: Fallback shells untouched

- **WHEN** `/docs/a` is prerendered under a `/docs` route
- **THEN** `shell.html` and `docs/index.html` contain empty boot slots and `docs/a/index.html` contains the rendered topic

### Requirement: A route's shell is its longest matching configured route

The tool SHALL pick, for each prerendered route, the shell of the configured route that is the longest path-prefix of it.

#### Scenario: Nested route resolves to its section shell

- **WHEN** routes are `['/', '/docs']` and `/docs/a` is prerendered
- **THEN** the markup is injected into a copy of the `/docs` shell, not the root shell

### Requirement: Output is sanity-checked independently of app validation

The tool SHALL fail the build when a rendered route yields empty markup, a state payload that does not `JSON.parse`, or a shell missing either boot slot.

#### Scenario: Drifted template

- **WHEN** a custom `html.template` omits the state-script slot
- **THEN** the prerender phase fails naming the missing slot

### Requirement: Prerender can be re-run against an existing build

`loom prerender` SHALL run the prerender phase alone against the current `outDir`, re-reading the preserved shells, so hook changes iterate without a full rebuild.

#### Scenario: Re-run after a hook change

- **WHEN** `loom build` has completed and `loom prerender` runs
- **THEN** every route is re-rendered from `shell.html` / the section shells and the output matches a fresh `loom build`

### Requirement: Prerendered routes can set head metadata

When `prerender.meta` is configured, the tool SHALL call it for each prerendered route with the route, its output and the bundle. When it returns a `title` or `description`, the tool SHALL write the `title` into that route's `<title>` and `og:title`, and the `description` into its `<meta name="description">` and `og:description`, escaping each value for HTML. A shell without a description tag SHALL get one; Open Graph tags SHALL be rewritten only where the shell has them. Fields it leaves out SHALL keep the shell's values.

#### Scenario: Per-route title

- **WHEN** `prerender.meta` returns `{ title: 'Routing | Site' }` for `/docs/routing`
- **THEN** that route's `index.html` carries `<title>Routing | Site</title>` and a matching `og:title`, and other routes keep the shell title

#### Scenario: No hook

- **WHEN** `prerender.meta` is not configured
- **THEN** every route keeps its shell's head unchanged
