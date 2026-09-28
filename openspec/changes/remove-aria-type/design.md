# Design — remove-aria-type

## Context

`Aria` (`{ label?, live?, role? }`) predates the `attrs` reserved prop. Core exports it but never consumes it. Two pink components declare `aria?: Aria` and read only `aria.label`, mapping it to `aria-label` on a `<button>`; both also accept `attrs` and forward it to the same element. `live` and `role` have never been wired anywhere.

## Goals / Non-Goals

**Goals:** one way to pass ARIA attributes (`attrs`); a core type surface with no unused exports; spec and code in agreement.

**Non-Goals:** a typed ARIA attribute vocabulary in core or pink; changing how `attrs` handles `aria-*` keys; touching `apps/docs`.

## Decisions

### D1 — Delete the type, don't relocate it

Moving `Aria` into pink would keep a prop that supports one attribute out of dozens, next to an `attrs` prop that supports all of them, reactive bindings included. Two routes to the same attribute also raise a precedence question (`aria.label` vs `attrs['aria-label']`) that a single route never has.

_Alternative — keep `aria` in pink with a local type:_ rejected; it preserves the duplication this change exists to remove.

### D2 — Clean break, no alias

`Aria` and the pink `aria` props are removed in one change with no deprecation window, consistent with the package's pre-1.0 stance: a removal is a breaking minor and the old name stops existing. The changesets state the break.

### D3 — `attrs` is the documented replacement

`attrs=${{ 'aria-label': … }}` works today on both components with no code change beyond the removal: `PinkButton` spreads `attrs` into the element's attributes, and `ToggleButtonItem` applies `$attrs=${attrs}` on its `<button>`.

## Risks / Trade-offs

- [An external pink consumer passes `aria={{ label }}`] → accepted pre-1.0. Under TypeScript it fails loudly as an unknown prop; in untyped use the label silently stops rendering, which the pink changeset calls out.
- [`PinkButton`'s `<a>` root never received `aria.label`] → `attrs` applies to both roots, so the replacement covers a case the old prop didn't.

## Migration Plan

Two minor releases (core, pink) from one change; each changeset states the removal. Rollback is a revert.

## Open Questions

None.
