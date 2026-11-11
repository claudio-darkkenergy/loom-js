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
- Reworking slot `node` bookkeeping for element-rooted instances. A stale slot node there heals on the next apply, since replacing a detached node is a no-op that returns the new one.

## Decisions

**D1. Refresh the stored list when it changes, rather than derive it on every read.** At first render the parser records the instance's top-level layout: in order, each static top-level node or the index of the top-level slot that fills that position. A refresh rebuilds `ctx.root` from that layout, taking each slot's current nodes (the child context's root for component and effect values, otherwise the slot's node or list). Alternatives: derive the list at each read, which touches every read site and recomputes on hot paths like list moves; or bracket each fragment with comment markers, which changes rendered and prerendered markup and hydration.

**D2. Refresh at the two places nodes change.** Component re-renders and activity effects are the only things that change a slot's nodes. The parser refreshes after its update path applies the changed slots. An effect refreshes after `textUpdater` returns, when its nodes differ from before. Both then walk up the parent chain, through slot contexts, refreshing each fragment-rooted ancestor whose top level holds the changed slot, and stop at the first element-rooted ancestor or unchanged list.

**D3. Hydrated instances record the same layout.** Hydration claims existing nodes rather than cloning, so the layout must be recorded from the claimed nodes on that path too. A spec hydrates a fragment with a top-level effect and swaps it.

## Risks / Trade-offs

- [The walk up runs on every effect swap] → It stops at the first element-rooted ancestor, which most trees reach in one or two steps; the benchmark suite confirms no regression.
- [A top-level slot that renders nothing still holds a placeholder text node] → The layout records the slot, not the node, so the placeholder is read like any other current node.
