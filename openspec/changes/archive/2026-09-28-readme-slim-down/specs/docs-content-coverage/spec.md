## RENAMED Requirements

- FROM: `### Requirement: Docs cover every consumer-facing README concept`
- TO: `### Requirement: Docs cover every consumer-facing core concept`

- FROM: `### Requirement: README edits propagate to docs`
- TO: `### Requirement: Core changes propagate to docs`

## MODIFIED Requirements

### Requirement: Docs cover every consumer-facing core concept

Every consumer-facing concept of `@loom-js/core` SHALL have a docs topic recorded in the content map, which lists per topic its outline and its source pointers into `packages/core/src/**` and the tests that pin the behavior. Every export of `src/index.ts` and `src/server.ts` SHALL be assigned to a topic in the map or listed there as a deliberate exclusion with its reason. The README is not a link in this chain.

#### Scenario: a concept has a docs home

- **WHEN** a consumer-facing core concept is checked against the content map
- **THEN** the map names the topic slug, the outline position, and the source files that carry it

#### Scenario: an export has a docs home

- **WHEN** an export of `@loom-js/core` or `@loom-js/core/server` is checked against the map's export coverage
- **THEN** it is assigned to a topic or listed as excluded with a reason

#### Scenario: example placement

- **WHEN** an example illustrates a concept
- **THEN** the example lives in that concept's topic, not in a separate examples page

### Requirement: Topic content is accurate to the current API

Docs topic content SHALL describe the API as the source implements it — signatures, prop names, defaults, and behavioral caveats match the files the content map points the topic at. Code samples in topics SHALL be syntactically valid and consistent with that API.

#### Scenario: signature parity

- **WHEN** a topic documents an exported API (e.g. `init`, `activity`, `createRoutes`, `lazyImport`)
- **THEN** the names, parameters, and defaults it shows exist in the current `@loom-js/core` type surface

#### Scenario: topic samples are valid

- **WHEN** a topic's code sample is extracted into a scratch TypeScript file with the package's types available
- **THEN** it parses and type-checks without errors (module-resolution shims aside)

### Requirement: Core changes propagate to docs

When a change alters consumer-visible behavior in a file the content map points a topic at, that change SHALL either update every topic listing the file (topic source, content map entry, published entry) or record a docs follow-up task — source↔docs drift is never silent.

#### Scenario: a pointed-to file changes behavior

- **WHEN** a change modifies consumer-visible behavior in a source file listed under one or more topics in the content map
- **THEN** the change's tasks include the update for each of those topics, or an explicit follow-up entry for it

#### Scenario: a new export lands

- **WHEN** a change adds an export to `src/index.ts` or `src/server.ts`
- **THEN** the change assigns it to a topic in the map's export coverage or records its exclusion with a reason
