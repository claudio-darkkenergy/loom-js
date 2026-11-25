## REMOVED Requirements

### Requirement: The prerender phase is a tool-owned pipeline with app hooks

**Reason**: Its `after` hook and its "Dev never prerenders" scenario no longer hold: generated files now come from `artifacts` in every command, and `loom dev --prerender` renders routes.
**Migration**: Replaced by "The prerender phase runs in every command that produces output" below. Rename `prerender.after` to `prerender.artifacts`.

## ADDED Requirements

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
