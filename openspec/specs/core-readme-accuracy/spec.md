## Purpose

Defines the accuracy obligations for `packages/core/README.md`, the package's front door: what it states matches the current implementation, its quick example is valid, and its links resolve to the published docs topics. API coverage is the docs site's obligation (`docs-content-coverage`).

Established by the `scrub-core-readme` change (2026-08-19); re-scoped to the slim README by `readme-slim-down` (2026-09-28).

## Requirements

### Requirement: Public export coverage is deliberate

Every export of `@loom-js/core` (`src/index.ts`) and `@loom-js/core/server` SHALL be either documented on the docs site per the re-anchored content map or deliberately excluded on record; the README SHALL NOT be required to carry API coverage, and everything the slim README does state — pitch, highlights, install, the quick example, topic links — SHALL be accurate to the current implementation and SHALL link to resolving canonical topic URLs.

#### Scenario: the slim README stays accurate and connected

- **WHEN** the slim README's claims, example, or topic links are audited
- **THEN** the claims and example match the current implementation and every link resolves to its published topic

#### Scenario: API coverage is the site's obligation

- **WHEN** a public-intent export lacks documentation
- **THEN** the gap is a docs-topic gap (per the re-anchored coverage spec), not a README gap

### Requirement: Code examples are valid

The README's quick example SHALL be syntactically valid and consistent with the current API.

#### Scenario: the quick example compiles

- **WHEN** the quick example is extracted into a scratch TypeScript file with the package's types available
- **THEN** it parses and type-checks without errors (module-resolution shims aside)
