# Design

## Context

`htmlParser` sets a fragment instance's `ctx.root` to the live fragment's child nodes on first render and re-captures it once after wiring the slots. The update path never touches it. An activity effect keeps its own `ctx.root` current through `textUpdater`, but nothing tells the enclosing component. `resolveValue` hands a child's `ctx.root` to the parent's slot, `isLiveContext` and the parser's in-place check read `root[0]`, and `onRendered` handlers and `node()` read the list directly.

Element-rooted instances are unaffected: their root is the element, and slot changes happen inside it.

## Goals / Non-Goals

**Goals:**

- Every reader of a fragment instance's `ctx.root` gets the current nodes, with no change at the read sites.
- Cost only when a top-level slot changes its nodes.

**Non-Goals:**

- Changing rendered markup, prerendered output or hydration matching.
- Reworking how element-rooted instances apply their slots. Their slot nodes are kept current by the same walk (D2), since a stale node that partly overlaps the live ones misplaces content or throws on the next apply.

## Decisions

**D1. Refresh the stored list when it changes, rather than derive it on every read.** At first render the parser records the instance's top-level layout: in order, each static top-level node or the index of the top-level slot that fills that position. A refresh rebuilds `ctx.root` from that layout, taking each slot's current nodes (the child context's root for component and effect values, otherwise the slot's node or list). Alternatives: derive the list at each read, which touches every read site and recomputes on hot paths like list moves; or bracket each fragment with comment markers, which changes rendered and prerendered markup and hydration.

**D2. Carry an effect's change up; let parser re-renders be placed by their parent.** When an effect re-renders on its own update, it replaces its previous node run with the new one in each holder up the parent chain: the root of each enclosing effect, the slot that places it (through the array context for a list item), and, where that slot is top-level, the fragment's root rebuilt from its layout. The walk stops at an element root or when a holder does not contain the run. A component re-rendered by its parser needs no walk: the enclosing render that called it places the result. The parser rebuilds a fragment's root after its update path applies any slot. A deferred refresh queue was rejected: a holder absorbed by a later render would be substituted twice.

**D3. Hydration needs no separate path.** Hydrate renders the app off-DOM through the same first-render path and swaps it in, so the layout is recorded there like any other render. A spec hydrates a fragment with a top-level effect and swaps it before release.

**D4. A list placed by a nested pass keeps its tail.** When a component re-renders inside its parent's effect, its own list pass can insert nodes before the parent's pass reaches the same list. The parent's tail anchor, read as the node after the previous end, can then be one of those new nodes. The parent's pass skips past nodes the list holds before inserting, only when the pass moves or adds items and the list has a following sibling.

## Risks / Trade-offs

- [The walk up runs on every effect update that changes nodes] → It stops at the first element root or holder without the run, usually within one or two steps; `pnpm bench` showed loom's operation medians within run-to-run noise.
- [A top-level slot that renders nothing still holds a placeholder text node] → The layout records the slot, not the node, so the placeholder is read like any other current node.
