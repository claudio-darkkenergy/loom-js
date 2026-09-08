## MODIFIED Requirements

### Requirement: Public export coverage is deliberate

Every export of `@loom-js/core` (`src/index.ts`) and `@loom-js/core/server` SHALL be either documented on the docs site per the re-anchored content map or deliberately excluded on record; the README SHALL NOT be required to carry API coverage, and everything the slim README does state — pitch, highlights, install, the quick example, topic links — SHALL be accurate to the current implementation and SHALL link to resolving canonical topic URLs.

#### Scenario: the slim README stays accurate and connected

- **WHEN** the slim README's claims, example, or topic links are audited
- **THEN** the claims and example match the current implementation and every link resolves to its published topic

#### Scenario: API coverage is the site's obligation

- **WHEN** a public-intent export lacks documentation
- **THEN** the gap is a docs-topic gap (per the re-anchored coverage spec), not a README gap
