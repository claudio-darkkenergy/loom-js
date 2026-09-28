## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Documented signatures match the source

**Reason**: The slim README carries no API signatures; the docs site is the canonical reference.

**Migration**: Signature accuracy is `docs-content-coverage`'s "Topic content is accurate to the current API", checked against the content map's source pointers.

### Requirement: Stale content is refreshed

**Reason**: Its scenarios describe the one-time scrub of sections the slim README no longer has.

**Migration**: What remains in the README is covered by "Public export coverage is deliberate", which requires everything the README states to match the current implementation.
