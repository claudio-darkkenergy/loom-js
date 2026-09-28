## MODIFIED Requirements

### Requirement: Deprecated aliases are removed and first-party code migrated

The exports `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps`, `RenderFunction`, `RenderProps`, and `Aria` SHALL NOT exist in `@loom-js/core`'s public surface, and no first-party workspace (core source, core tests, `@loom-js/pink`, `apps/loom`) SHALL import them. First-party components SHALL accept ARIA attributes through the `attrs` reserved prop rather than a dedicated `aria` prop.

#### Scenario: removed aliases are gone from the surface

- **WHEN** `@loom-js/core`'s exports are inspected (via `index.ts` or the built `index.d.ts`)
- **THEN** none of `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps`, `RenderFunction`, `RenderProps`, `Aria` are exported

#### Scenario: first-party consumers use canonical names

- **WHEN** the monorepo is searched for the removed alias names
- **THEN** no source file under `packages/core/src`, `packages/core/tests`, `packages/pink/src`, or `apps/loom` references them
- **AND** `pnpm -F @loom-js/core type-check`, `pnpm -F @loom-js/core type-check-tests`, and `pnpm -F @loom-js/pink type-check` all pass

#### Scenario: ARIA attributes reach the element through attrs

- **WHEN** `PinkButton` or a `PinkToggleButton` item is given `attrs` containing `'aria-label'`
- **THEN** the rendered `<button>` carries that `aria-label`, and neither component declares an `aria` prop
