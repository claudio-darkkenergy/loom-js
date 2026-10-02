## MODIFIED Requirements

### Requirement: The sandbox builds and serves

`pnpm -F @loom-js/sandbox build` SHALL emit a build through `loom build`, and `pnpm -F @loom-js/sandbox dev` SHALL serve it through `loom dev` with every configured route rendering — the sandbox owns a `loom.config.ts` and no build scripts of its own.

#### Scenario: build emits a shell per route

- **WHEN** `pnpm -F @loom-js/sandbox build` is run
- **THEN** it exits successfully and `build/` contains an HTML shell for `/`, `/core`, `/lazyload` and `/event-monitoring`

#### Scenario: routes render in dev

- **WHEN** the dev server is running and each route is opened in a browser
- **THEN** the page content renders and the console shows no errors

#### Scenario: in-app navigation works

- **WHEN** a link on one sandbox page is clicked
- **THEN** the target page renders without a full page load

#### Scenario: no per-app build wiring

- **WHEN** `apps/sandbox/project/client/` is inspected
- **THEN** it contains no `build.mts`, `dev.mts`, `config.mts` or `template.html.mts`
