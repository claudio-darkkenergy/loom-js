## MODIFIED Requirements

### Requirement: Upstream pink ports require explicit maintainer approval per component

A component gap that cannot be met by composing existing `@loom-js/pink` exports MAY be filled by adding a loom component to `@loom-js/pink` over the Pink Design styles the package already carries (the source adopted from appwrite/pink 1.0.0, under `packages/pink/scss`) — but only after the maintainer explicitly approves that specific component. Approval SHALL be sought per component, before implementation begins; a change-level or batch approval does not substitute.

#### Scenario: Gap identified

- **WHEN** the component inventory identifies a need with no pink export or composition that covers it
- **THEN** the candidate component (and the styles in `packages/pink/scss` it would wrap) is presented to the maintainer for approval before any component code is written

#### Scenario: Approval withheld

- **WHEN** the maintainer declines a proposed component
- **THEN** the need is met by a composition fallback or the content is restructured to not require it — the component is not added

#### Scenario: Approved port lands in pink

- **WHEN** a component is approved and implemented
- **THEN** it lands in `packages/pink` as a loom pink component (following pink's existing component conventions) with a minor changeset
