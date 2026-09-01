# Design — document-component-refs

## Context

The render function's props are `ComponentOutputProps` = the five life-cycle hooks + `UtilityProps` (`node()`, `createRef()`, `ctxRefs()`) + the caller's props + `ReservedProps` (minus `ref`, which is consumed). Refs are the only undocumented third of that: `createRef()` mints a `RefContext`; passed to a child as `ref`, it exposes the child's `node()` and life-cycle hooks to the creator; `ctxRefs()` iterates a component's minted refs in creation order. Core specs (`create-ref.ts`, `context-refs.ts`) pin the behavior; `RefContext` is a public type export.

## Goals / Non-Goals

**Goals:** README and docs cover refs and the full prop surface; the accuracy spec closes the loophole that let an exported prop-surface type go undocumented.

**Non-Goals:** API changes (the surface ships as-is); documenting internal context machinery (`ComponentContext` stays internal); a refs deep-dive topic (it's a Components subsection).

## Decisions

### D1 — Refs are a Components subsection, not a topic

README: a `#### Refs` block under Components (the section already reads as one concept's reference; `####` matches how Custom elements and Activities structure sub-concerns). Docs: the components topic gains the matching section per the map's flattening conventions, ordered after Life-cycle hooks (a ref is "a child's node + hooks, from the outside") and before Attribute and text values.

### D2 — One prop-surface table, pointers not prose

The `props` bullet gains a compact table of the reserved props with one-line meanings and pointers to their owning sections. The table's job is completeness-at-a-glance; depth stays where it lives today. `routeProps` and `ref` get their pointers into Routing and the new Refs block respectively.

### D3 — The example is the tested pattern

The Refs code sample mirrors `create-ref.ts`'s shape: parent mints `createRef()`, passes `ref` to a child component element, then uses the ref's `node()`/hooks — demonstrating the case `node()` alone can't cover (reaching a _child's_ rendered node). Example validity falls under the accuracy spec's compile scenario.

### D4 — Spec delta sharpens, doesn't restate

`core-readme-accuracy`'s export-coverage requirement already implies this; the delta adds the concrete scenario (prop-surface types fully documented) so the next audit can't miss it the same way.

## Risks / Trade-offs

- [The prop-surface table drifts from `ReservedProps`] → it lives in the README, which the accuracy spec audits against `src/types.ts`; the new scenario names the types explicitly.

## Migration Plan

Docs-only. README edit + topic re-push land together; archive syncs the spec delta.

## Open Questions

None.
