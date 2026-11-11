# Proposal

## Why

A fragment-rooted component records its top-level nodes once, at first render, and never updates the list. When a top-level slot later changes its nodes, the instance's `node()` and its liveness check still point at the old ones. Two failures follow, both reproduced with core alone:

- A component whose top level is an `activity.effect(...)` renders empty on its next prop-driven re-render once the effect has swapped its content. The first recorded node is detached, so the parser treats the instance as dead and renders a fresh copy that never reaches the document.
- A component whose top level is a list returns only the nodes it first rendered from `node()` after the list grows, and life-cycle handlers receive the same stale list.

The devtools HUD hit the first one in its value editor and avoided it with a single root element. Any app using the same shape loses content.

## What Changes

- A fragment-rooted instance keeps its node list current: when a top-level slot replaces, adds or removes nodes, the list is rebuilt from the instance's top-level layout, and the change carries up to any fragment-rooted ancestor whose top level contains it.
- An effect at the top level of a fragment that swaps its content updates the enclosing instance's list, so a later prop-driven re-render updates the instance in place.
- `node()`, life-cycle handlers, the liveness check and keyed list moves all see the current nodes.
- No API change, and the rendered and prerendered markup are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `template-root-forms`: adds the requirement that a fragment root's node list follows its live top-level nodes after first render.

## Impact

- `packages/core`: `html-parser.ts` (record the top-level layout, refresh after updates), `activity.ts` (refresh the enclosing fragment after an effect swaps nodes), a small helper for rebuilding and propagating the list, and new specs beside `template-root-forms.spec.ts` and `fragment-array-reconciliation.spec.ts`.
- A core patch changeset. No docs topic describes the stale behavior, so the components topic needs no change.
- `@loom-js/devtools` keeps its single-root value editor; that root is ordinary markup, not a workaround to retire.
