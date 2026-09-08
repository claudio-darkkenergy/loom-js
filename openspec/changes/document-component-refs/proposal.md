# Document Component Refs

## Why

The ref API is blessed, exported, and tested — `createRef()`/`ctxRefs()` on the render function's props, the `ref` reserved prop, the public `RefContext` type, with dedicated core specs — but has zero README coverage and therefore zero docs coverage (maintainer confirmation 2026-08-31: created out of necessity, used in external projects). It slipped the `core-readme-accuracy` scrub, and the README's `props` description undersells the whole surface: reserved props (`attrs`, `on`, `onClick`, `className`, `id`, `style`, `key`, `ref`, `slots`, `routeProps`) are documented piecemeal or not at all.

## What Changes

- `packages/core/README.md` Components section gains its Refs coverage as a subsection of the new Built-in props section: `createRef()` → `RefContext`, handing it to a child via the `ref` prop, what the parent gets back (the child's `node()` and life-cycle hooks), `ctxRefs()` iteration in creation order, and when to reach for a ref instead of the component's own `node()`.
- Components gains a **Built-in props** section (scope upgraded at review, 2026-09-03): every reserved prop and utility getter gets its own entry — a short prose description of what it does and its defaults/behavior — not just a summary table. Entries whose _depth_ lives elsewhere say what the prop is here and point to the owning treatment: `children`/`slots`/`key` are defined here, with Element Syntax keeping the authoring mechanics (its Children/Named slots/Keys sections); `routeProps` → Routing; `attrs`/`on`/`onClick` → their element-binding semantics; `ref` → the Refs subsection, which nests inside this section.
- Docs parity rides the same change per the standing `docs-content-coverage` propagation requirement: the components topic gains the matching `Refs` section, and the content map is amended.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-readme-accuracy`: the export-coverage requirement gains the case that slipped — exported types describing the component prop surface (`UtilityProps`, `ReservedProps`, `RefContext`) SHALL have every member documented or deliberately excluded on record.

## Impact

- `packages/core/README.md` — Components section (Refs subsection + prop-surface table). No code changes; the API ships already.
- `openspec/changes/align-loom-docs-with-core-readme/contentful-sync/topics/04-components.md` + `content-map.md` — parity section and map amendment; draft re-push.
- `openspec/specs/core-readme-accuracy/spec.md` — delta at archive.
