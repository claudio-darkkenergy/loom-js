# docs-content-coverage Specification

## Purpose

Defines the parity contract between `packages/core/README.md` and the docs app: every consumer-facing README concept has a docs topic recorded in the change's content map (README headings → topic slug and outline), topic content matches the current API as the README documents it, and README edits either update the corresponding topic or record an explicit docs follow-up — drift is never silent.

Established by the `align-loom-docs-with-core-readme` change (2026-08-28).

## Requirements

### Requirement: Docs cover every consumer-facing README concept

Every consumer-facing section of `packages/core/README.md` SHALL have a corresponding docs topic whose coverage is recorded in the change's content map (README headings → topic slug and outline). No README concept may lack a docs home.

#### Scenario: README section has a docs home

- **WHEN** a consumer-facing README section (Concepts or Examples) is checked against the content map
- **THEN** the map names the topic slug and outline position that carries that section's content

#### Scenario: README example placement

- **WHEN** a README example illustrates a concept
- **THEN** the example's content lives in that concept's topic, not in a separate examples page

### Requirement: Topic content is accurate to the current API

Docs topic content SHALL describe the API as `packages/core/README.md` documents it — signatures, prop names, defaults, and behavioral caveats match. Where `core-api-follow-ups` changes the README (`placement`, route `guard`, lazy-import typing), the topics SHALL match the post-change README.

#### Scenario: Signature parity

- **WHEN** a topic documents an exported API (e.g. `init`, `activity`, `createRoutes`, `lazyImport`)
- **THEN** the names, parameters, and defaults it shows exist in the current `@loom-js/core` type surface as the README documents them

#### Scenario: Follow-ups sections authored post-merge

- **WHEN** the `bootstrapping`, `routing`, or `lazy-imports` topic is authored before `core-api-follow-ups` has landed
- **THEN** the content map flags that topic for a follow-up parity pass instead of silently shipping pre-change API descriptions

### Requirement: README edits propagate to docs

When a change edits a consumer-facing section of `packages/core/README.md`, that change SHALL either update the corresponding docs topic (and content map entry) or record a docs follow-up task — README↔docs drift is never silent.

#### Scenario: README section changes

- **WHEN** a change modifies a README section that the content map assigns to a topic
- **THEN** the change's tasks include the docs-topic update or an explicit follow-up entry for it
