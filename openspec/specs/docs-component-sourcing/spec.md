# docs-component-sourcing Specification

## Purpose

Defines the sourcing rules for docs-app UI in `@loom-js/loom`: compose from existing `@loom-js/pink` exports first (single components or compositions), reserve app-local markup/styling for genuinely app-specific concerns, and fill real component gaps only by adding a loom component over the Pink Design styles `@loom-js/pink` already carries — with the maintainer's explicit, per-component approval before any component code is written.

Established by the `align-loom-docs-with-core-readme` change (2026-08-28); the upstream appwrite/pink source was adopted into `packages/pink` by `adopt-pink-source` (2026-10-04).

## Requirements

### Requirement: Docs UI composes from @loom-js/pink first

New docs-app UI components SHALL be composed from existing `@loom-js/pink` exports where a pink component (or composition of pink components) fits. App-local markup/styling is reserved for genuinely app-specific concerns (layout glue, branding), not for re-implementing design-system pieces.

#### Scenario: Pink component exists for the need

- **WHEN** a docs UI need matches an existing `@loom-js/pink` export (e.g. code panels via `PinkCodePanel`, navigation via `PinkSideNav`)
- **THEN** the app component composes that export rather than duplicating its markup or styles locally

#### Scenario: Composition covers the need

- **WHEN** no single pink export fits but a composition of pink components does
- **THEN** the app component is built as that composition, in the app workspace

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
