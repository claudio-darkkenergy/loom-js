# build-tool-prerender Specification

## Purpose

The build tool's prerender phase: how `loom build` renders configured routes into their shells at build time, which hooks the app supplies, and how the output is checked.

## Requirements

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

### Requirement: The prerender phase runs in every command that produces output

When `prerender` is configured, `loom build` SHALL add `prerender.entry` to the client build as `static/js/prerender`. A production `loom build` SHALL load it from `outDir` after bundling and, for every route returned by `prerender.routes(bundle)`, render through the bundle's `prerenderRoute(url, window)` against a fresh `linkedom` window, run `prerender.validate`, inject markup and state into the route's shell through the core boot contract, and write `<outDir>/<route>/index.html`. `prerender.setup(bundle)` SHALL run once before enumeration, and `prerender.artifacts({ bundle, outDir, mode })` SHALL run once after every route is written.

#### Scenario: Routes enumerated by the app

- **WHEN** `prerender.routes` returns `['/', '/docs/a', '/docs/b']`
- **THEN** `index.html`, `docs/a/index.html` and `docs/b/index.html` carry rendered markup and a populated state script, and no other route is rendered

#### Scenario: Validation failure fails the build

- **WHEN** `prerender.validate` throws for a route
- **THEN** `loom build` exits non-zero with that error and does not emit the route

#### Scenario: Missing render export

- **WHEN** the prerender entry does not export `prerenderRoute`
- **THEN** the build fails naming the missing export before any route is rendered

#### Scenario: Dev renders no routes by default

- **WHEN** `loom dev` runs with `prerender` configured and without `--prerender`
- **THEN** the prerender bundle is loaded for `setup` and `artifacts`, `routes` and `validate` never run, and shells keep empty boot slots

#### Scenario: Dev renders routes on request

- **WHEN** `loom dev --prerender` runs
- **THEN** the full phase runs on start and after every successful rebuild, and each enumerated route is served with rendered markup and a populated state script that the client hydrates

### Requirement: Generated files come from one hook that runs everywhere output is produced

`prerender.artifacts({ bundle, outDir, mode })` SHALL be the one hook for files an app generates from its prerender bundle. It SHALL run after `setup` in every command that produces output: a production `loom build` and `loom prerender` (after route rendering), a development `loom build`, and `loom dev` (on start, after every successful rebuild, and on demand). `mode` SHALL tell the hook which mode the bundle was built in. Files it writes under `outDir` SHALL be served by `loom dev` at the same paths the production build serves them.

#### Scenario: Artifact present in dev and build

- **WHEN** `artifacts` writes `<outDir>/static/data.json` and the app runs under `loom dev`
- **THEN** `/static/data.json` is served with the written content, and a production `loom build` emits the same path

#### Scenario: Regenerated after a rebuild

- **WHEN** a source file the prerender bundle imports changes while `loom dev` runs
- **THEN** `artifacts` runs again against the rebuilt bundle and the served file reflects the change without a server restart

#### Scenario: Regenerated on demand

- **WHEN** content behind an artifact changes with no source edit and the user types `r` and Enter in the `loom dev` terminal
- **THEN** `setup` and `artifacts` run again and the served file reflects the new content

#### Scenario: Runs never overlap

- **WHEN** a rebuild finishes while an `artifacts` run is in progress
- **THEN** the in-flight run completes, exactly one more run starts after it, and no two runs write concurrently

### Requirement: Dev hook failures are warnings

In `loom dev`, an error thrown by `setup`, `routes`, `validate`, `artifacts` or a route render SHALL be logged as a `[loom dev]` warning naming the hook and the error, and the server SHALL keep serving. Files from the last successful run SHALL stay in place. Every other command SHALL keep failing on the same errors.

#### Scenario: Missing credentials in dev

- **WHEN** `setup` throws because required environment variables are absent and `loom dev` is running
- **THEN** the terminal shows the warning, the app is served, and the generated files are absent until a later run succeeds

#### Scenario: Same failure in a build

- **WHEN** `setup` throws the same error during `loom build`
- **THEN** the build exits non-zero with that error
