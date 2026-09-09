# docs-component-sourcing Specification (delta)

## ADDED Requirements

### Requirement: Docs UI composes from @loom-js/pink first

New docs-app UI components SHALL be composed from existing `@loom-js/pink` exports where a pink component (or composition of pink components) fits. App-local markup/styling is reserved for genuinely app-specific concerns (layout glue, branding), not for re-implementing design-system pieces.

#### Scenario: Pink component exists for the need

- **WHEN** a docs UI need matches an existing `@loom-js/pink` export (e.g. code panels via `PinkCodePanel`, navigation via `PinkSideNav`)
- **THEN** the app component composes that export rather than duplicating its markup or styles locally

#### Scenario: Composition covers the need

- **WHEN** no single pink export fits but a composition of pink components does
- **THEN** the app component is built as that composition, in the app workspace

### Requirement: Upstream pink ports require explicit maintainer approval per component

A component gap that cannot be met by composing existing `@loom-js/pink` exports MAY be filled by porting the component from upstream appwrite/pink (https://github.com/appwrite/pink) into `@loom-js/pink` — but only after the maintainer explicitly approves that specific component. Approval SHALL be sought per component, before implementation begins; a change-level or batch approval does not substitute.

#### Scenario: Gap identified

- **WHEN** the component inventory identifies a need with no pink export or composition that covers it
- **THEN** the candidate upstream component is presented to the maintainer for approval before any port code is written

#### Scenario: Approval withheld

- **WHEN** the maintainer declines a proposed port
- **THEN** the need is met by a composition fallback or the content is restructured to not require it — the upstream component is not ported

#### Scenario: Approved port lands in pink

- **WHEN** a port is approved and implemented
- **THEN** it lands in `packages/pink` as a loom pink component (following pink's existing component conventions) with a minor changeset
