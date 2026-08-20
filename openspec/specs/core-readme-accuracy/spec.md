## Purpose

Defines the accuracy obligations for `packages/core/README.md`, the canonical API reference for `@loom-js/core`: every documented signature matches the source, every public export is documented or deliberately excluded on record, every code example is syntactically valid, and stale content referencing retired tooling is refreshed. Established by the `scrub-core-readme` change (2026-08-19).

## Requirements

### Requirement: Documented signatures match the source

Every API signature, argument, option, default value, and return shape stated in `packages/core/README.md` SHALL match the current implementation in `packages/core/src/`.

#### Scenario: Activity signature is complete

- **WHEN** a reader consults the Activities section
- **THEN** it documents `activity<V, I = V>(initialValue, transformOrOptions?, options?)`, including the transform argument (`({ input, update, value })`, with async transform promises tracked by the settlement signal) and the `deep` and `force` options

#### Scenario: Activity return shape is complete

- **WHEN** a reader consults the Activities "Returns" block
- **THEN** it lists every returned member — `bind`, `effect`, `initialValue`, `reset`, `update` (including its `forceUpdate` second parameter), `value` (including its shallow-copy semantics), and `watch`

#### Scenario: All five lifecycle hooks are documented

- **WHEN** a reader consults the Components concept
- **THEN** all five lifecycle hooks (`onBeforeRender`, `onCreated`, `onMounted`, `onRendered`, `onUnmounted`) are documented with their timing, and no section claims only two exist

#### Scenario: init props are complete

- **WHEN** a reader consults the Bootstrapping section
- **THEN** `AppInitProps` documents `app`, `append`, `globalConfig`, `onAppMounted`, and `root` (with its `document.body` default)

### Requirement: Public export coverage is deliberate

Every export of `@loom-js/core` (`src/index.ts`) and `@loom-js/core/server` SHALL be either documented in the README or deliberately excluded, with the exclusion decision and reason recorded in the change (not the README).

#### Scenario: Previously undocumented public exports gain sections

- **WHEN** the audit encounters a public-intent export with no README coverage (e.g. `simple`, `lazyImport`)
- **THEN** the README gains documentation for it

#### Scenario: Internal-leaning exports are excluded on record

- **WHEN** the audit encounters an export judged internal plumbing (e.g. `canDebug`, `setToken`)
- **THEN** it is omitted from the README and listed with a reason in the change's notes for review

### Requirement: Code examples are valid

Every code example in the README SHALL be syntactically valid and consistent with the documented API.

#### Scenario: Examples compile

- **WHEN** an example is extracted into a scratch TypeScript file with the package's types available
- **THEN** it parses and type-checks without errors (module-resolution shims aside)

#### Scenario: Known-broken examples are fixed

- **WHEN** the scrub reaches the `init` Quick Example, the `node()` example, the Life Cycles example, and the Activity example
- **THEN** their syntax errors (missing comma, malformed `/` comments, unclosed `<span>`, missing closing brace) are corrected

### Requirement: Stale content is refreshed

README content referencing retired tooling or obsolete conventions SHALL be replaced with the current idiom.

#### Scenario: Retired tooling references are replaced

- **WHEN** the scrub reaches content predating the current build story (e.g. the `PrerenderSsgWebpackPlugin` bootstrapping example, `npm i -S`)
- **THEN** the content is rewritten to the current equivalent (`renderToString`-based SSG; plain `npm i`)
