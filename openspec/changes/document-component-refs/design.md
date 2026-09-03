# Design — document-component-refs

## Context

The render function's props are `ComponentOutputProps` = the five life-cycle hooks + `UtilityProps` (`node()`, `createRef()`, `ctxRefs()`) + the caller's props + `ReservedProps` (minus `ref`, which is consumed). Refs are the only undocumented third of that: `createRef()` mints a `RefContext`; passed to a child as `ref`, it exposes the child's `node()` and life-cycle hooks to the creator; `ctxRefs()` iterates a component's minted refs in creation order. Core specs (`create-ref.ts`, `context-refs.ts`) pin the behavior; `RefContext` is a public type export.

## Goals / Non-Goals

**Goals:** README and docs cover refs and the full prop surface; the accuracy spec closes the loophole that let an exported prop-surface type go undocumented.

**Non-Goals:** API changes (the surface ships as-is); documenting internal context machinery (`ComponentContext` stays internal); a refs deep-dive topic (it's a Components subsection).

## Decisions

### D1 — Refs are a Components subsection (inside Built-in props), not a topic

README: a `#### Refs` block under Components (the section already reads as one concept's reference; `####` matches how Custom elements and Activities structure sub-concerns). Docs: the components topic gains the matching section per the map's flattening conventions, ordered after Life-cycle hooks (a ref is "a child's node + hooks, from the outside") and before Attribute and text values.

### D2 — A Built-in props section: per-prop prose, owned depth pointed to (upgraded 2026-09-03)

A named **Built-in props** section under Components (heading = discoverability, per the IA principle) with one entry per member of the surface — `children`, `slots`, `key`, `ref`, `attrs`, `on`, `onClick`, `className`, `id`, `style`, `routeProps`, and the utility getters `node()`, `createRef()`, `ctxRefs()` — each a few sentences of what it does, not a table row. Where depth already has a home, the entry defines the prop and points: `children` is _defined_ here (the prop every component receives) while Element Syntax keeps the _authoring_ mechanics (how markup fills it, `</>`, slot labels); `routeProps` points to Routing; `attrs`/`on`/`onClick` note the element-binding relationship (coordinating with the sweep's element-bindings candidate rather than duplicating it). The Refs material (D1/D3) nests as this section's `ref`-adjacent subsection. The `props` bullet in the template-function docs shrinks to one sentence pointing at the section. The section closes with a **See also** block (the lookup-surface convention, `docs-ia-discoverability` D2b) — seeded manually here since this change may land pre-sweep: Element Syntax's Children/Named slots/Keys and sigil sections, Routing's `routeProps`, the element-binding examples, and core's ref specs.

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
