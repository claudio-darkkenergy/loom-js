# Remove Aria Type

## Why

`Aria` is a three-field interface (`label`, `live`, `role`) exported from `@loom-js/core` that core never reads: no runtime code consumes it, `ReservedProps` has no `aria` member, and the README doesn't document it. ARIA attributes already travel through `attrs` (`attrs=${{ 'aria-pressed': … }}`), reactive bindings included. The export has carried a `@deprecated` comment pointing at `ReservedProps['attrs']` while the `core-type-surface` spec says it SHALL remain — the two disagree, and the only live consumers are two pink components that read `aria.label` and nothing else (maintainer decision, 2026-09-27).

## What Changes

- **BREAKING** (`@loom-js/core`) — the `Aria` interface is deleted from `types.ts` and from the package's exports. No alias, no transition window.
- **BREAKING** (`@loom-js/pink`) — `PinkButton` and `PinkToggleButton` items drop their `aria` prop. Callers pass ARIA attributes through `attrs`, which both components already forward to the rendered `<button>`: `attrs=${{ 'aria-label': 'Close' }}`.
- `PinkButton`'s root-element comment stops listing `aria` among the `<button>`-only props.
- Two **minor** changesets (pre-1.0 convention): one for core, one for pink, each stating the break.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-type-surface`: the "Deprecated aliases are removed and first-party code migrated" requirement adds `Aria` to the exports that SHALL NOT exist, replacing "`Aria` SHALL remain exported".

## Impact

- `packages/core/src/types.ts` (interface deleted), `packages/core/src/index.ts` (export + its comment deleted).
- `packages/pink/src/elements/pink-button/pink-button.ts`, `packages/pink/src/components/pink-toggle-button/pink-toggle-button.ts` (prop, import, and the `aria-label` wiring removed).
- No in-repo caller passes `aria` to either component (`PinkCopyButton` already uses `attrs: { 'aria-label': label }`), so no call sites change.
- `apps/docs` imports `Aria` but sits outside the workspace; untouched.
- Sequencing: `packages/core/src/types.ts` is also edited by `fragment-root-inference` — start after that lands.
