## ADDED Requirements

### Requirement: One bench app, one implementation per framework

The `@loom-js/bench` workspace SHALL contain one implementation of the bench app for each of: loom, react, vue 3, svelte, solid and vanilla JS. Every implementation SHALL render the same DOM contract: a toolbar of buttons with the ids `run`, `runlots`, `add`, `update`, `clear`, `swaprows`, and a `<table>` whose rows carry the row id, a select link and a remove button, each row keyed by its id.

#### Scenario: Implementations are interchangeable to the runner

- **WHEN** the runner loads any framework's built page and clicks `#run`
- **THEN** the table contains exactly 1000 rows whose ids are 1..1000, with no framework-specific selector needed

#### Scenario: Missing implementation fails the build

- **WHEN** a framework listed in the suite has no buildable entry
- **THEN** the bench build exits non-zero naming that framework

### Requirement: Implementations render identical data

All implementations SHALL take their rows from one shared, seeded generator so that the labels rendered by every framework are identical for the same operation sequence.

#### Scenario: Same labels across frameworks

- **WHEN** two frameworks' pages each perform `run` from a fresh load
- **THEN** the text of row N is the same in both tables for every N

### Requirement: Implementations are idiomatic and keyed

Each implementation SHALL use its framework's idiomatic keyed-list form and MUST NOT manipulate the DOM outside the framework or use framework-internal scheduling escape hatches. The loom implementation SHALL be declarative `component` + `activity` code with no imperative DOM updates.

#### Scenario: Idiom check on review

- **WHEN** an implementation is reviewed
- **THEN** every DOM change traces to the framework's own render path (loom templates, react elements, vue templates, svelte markup, solid JSX, or the vanilla app's own DOM code)

### Requirement: Each framework builds through its own compiler path

Each implementation SHALL be bundled by esbuild in production mode (`minify`, `format: 'esm'`, `bundle`, `metafile`, no sourcemap) through the framework's compiler integration: JSX automatic runtime for react, a small in-repo esbuild plugin over `vue/compiler-sfc` for vue SFCs, `esbuild-svelte` for svelte, `esbuild-plugin-solid` for solid, plain TypeScript for vanilla, and the `@loom-js/core` package `dist/` build for loom.

#### Scenario: Loom measures the built package

- **WHEN** the loom bench bundle is built
- **THEN** `@loom-js/core` resolves to the workspace package's compiled `dist/` output, not its `src/`

#### Scenario: Versions come from the installed packages

- **WHEN** the runner records a framework's version
- **THEN** the value is the installed package's `version` field (`react`, `vue`, `svelte`, `solid-js`, `@loom-js/core`), and vanilla records `null`

### Requirement: Implementations announce readiness

Each implementation SHALL call the shared `markReady()` exactly once after its initial UI has mounted, so startup time is comparable across frameworks.

#### Scenario: Ready mark present

- **WHEN** a framework's page finishes loading
- **THEN** `performance.getEntriesByName('bench:ready')` has exactly one entry
