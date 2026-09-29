# sandbox-baseline-health Specification

## Purpose

Defines the baseline for `apps/sandbox`, the scratch app for trying core changes against a real build: it is a workspace member, builds and type-checks against the current `@loom-js/core` API, and its routes render without errors.

Established by the `restore-sandbox-build` change (2026-09-29).

## Requirements

### Requirement: The sandbox is a workspace member

`apps/sandbox` SHALL be part of the pnpm workspace, so `pnpm install` resolves its dependencies and turbo runs its tasks.

#### Scenario: install resolves the sandbox

- **WHEN** `pnpm install` is run at the repo root
- **THEN** `apps/sandbox/node_modules` contains its `workspace:*` dependencies, linked to the working tree

#### Scenario: no import of a missing package

- **WHEN** the sandbox source and manifest are checked
- **THEN** every imported package is declared in `apps/sandbox/package.json` and exists in the workspace or on npm

### Requirement: The sandbox type-checks cleanly

`pnpm -F @loom-js/sandbox type-check` SHALL complete with zero TypeScript errors against the working tree's `@loom-js/core`.

#### Scenario: type-check reports no errors

- **WHEN** `pnpm -F @loom-js/sandbox type-check` is run
- **THEN** it exits successfully with zero reported TypeScript errors

#### Scenario: a core API removal surfaces in the sandbox

- **WHEN** a change removes or renames a core export the sandbox imports
- **THEN** the sandbox type-check fails in that change

### Requirement: The sandbox builds and serves

`pnpm -F @loom-js/sandbox build` SHALL emit a build, and `pnpm -F @loom-js/sandbox dev` SHALL serve it with every configured route rendering.

#### Scenario: build emits a shell per route

- **WHEN** `pnpm -F @loom-js/sandbox build` is run
- **THEN** it exits successfully and `build/` contains an HTML shell for `/`, `/core`, `/lazyload` and `/event-monitoring`

#### Scenario: routes render in dev

- **WHEN** the dev server is running and each route is opened in a browser
- **THEN** the page content renders and the console shows no errors

#### Scenario: in-app navigation works

- **WHEN** a link on one sandbox page is clicked
- **THEN** the target page renders without a full page load
