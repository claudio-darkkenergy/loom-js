## Why

A fragment-rooted value (a multi-node region or fragment-template component) passed as an **item of a children array** stringifies — `handleArrayValue` (`packages/core/src/lib/templating/get-text-update.ts`) coerces the array-resolved item to `String(nodes)`, rendering `"[object Text],[object HTMLDivElement]"`. The element-syntax umbrella documented this as unsupported (Decision 7, `2026-08-16-element-syntax-first`) and deferred a fix; its own risk log notes the limitation becomes more visible as template components proliferate. With the pink/app conversion done and template components now the default authoring style, natural compositions like `Component({ children: [slots.col1, slots.col2] })` or an array-mapped list of fragment-rooted components hit the path routinely.

## What Changes

- `handleArrayValue` learns to reconcile an array **item** that itself resolves to an array of nodes (the root of a fragment-rooted region or fragment-template component): the item's nodes are inserted/moved as a group instead of being coerced to a text node via `String(...)`.
- Group-aware bookkeeping: the live-node array tracks each fragment-rooted item as a unit so reorders, updates, and removals affect the whole group (today's cursor/splice logic assumes one node per item).
- Cleanup handles groups: removing or truncating an array item removes all of that item's nodes, not one.
- Keyed reuse and child-context snapshotting (`appendChildContext` / `getContextForValue`) continue to work unchanged for fragment-rooted items — the context layer already keys per item; only the DOM bookkeeping changes.
- The documented "arrays of regions are unsupported" caveat is retired: interpolating a region directly (`${slots.col1}`) and passing it as a children-array item become equivalent.

Not changing: single-value interpolation paths (`updateLiveNode`, top-level fragment slots — already fixed by the named-slots change), the compile-component-tags transform, and `resolveValue` semantics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-array-reactivity`: array reconciliation gains a requirement that an item resolving to a node array (fragment-rooted region/component) renders its nodes as a managed group — insert, reorder, update, and removal semantics — instead of stringifying.

## Impact

- **Code**: `packages/core/src/lib/templating/get-text-update.ts` (primarily `handleArrayValue`); possibly `packages/core/src/types.ts` if the live-node bookkeeping needs a nested-array shape (`TemplateRootArray` items).
- **Tests**: new specs under `packages/core/tests/` (wtr + puppeteer) covering fragment-rooted items in children arrays: initial render, update, reorder, truncate, mixed element/fragment/text arrays.
- **Consumers**: no API change — existing behavior for element/text items is unchanged; previously-stringifying compositions start rendering correctly. `@loom-js/pink` and `apps/loom` need no edits (they interpolate regions today per the documented workaround) but may simplify later.
- **Docs**: the umbrella's Decision 7 caveat is superseded; any "arrays of regions are unsupported" note in READMEs/docs gets removed.
