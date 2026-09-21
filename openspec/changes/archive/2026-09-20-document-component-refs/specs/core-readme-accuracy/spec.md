## MODIFIED Requirements

### Requirement: Public export coverage is deliberate

Every export of `@loom-js/core` (`src/index.ts`) and `@loom-js/core/server` SHALL be either documented in the README or deliberately excluded, with the exclusion decision and reason recorded in the change (not the README). Exported types that describe the component render function's prop surface (`UtilityProps`, `ReservedProps`, `RefContext`) SHALL have every member documented or recorded as a deliberate exclusion.

#### Scenario: Previously undocumented public exports gain sections

- **WHEN** the audit encounters a public-intent export with no README coverage (e.g. `simple`, `lazyImport`)
- **THEN** the README gains documentation for it

#### Scenario: Internal-leaning exports are excluded on record

- **WHEN** the audit encounters an export judged internal plumbing (e.g. `canDebug`, `setToken`)
- **THEN** it is omitted from the README and listed with a reason in the change's notes for review

#### Scenario: The component prop surface is fully documented

- **WHEN** an exported type contributes members to the render function's props (utility getters such as `createRef`/`ctxRefs`, reserved props such as `ref`)
- **THEN** the README documents each member — or records its deliberate exclusion — rather than describing the props object only partially
