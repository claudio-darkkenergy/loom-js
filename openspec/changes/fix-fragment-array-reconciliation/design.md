## Context

`handleArrayValue` (`packages/core/src/lib/templating/get-text-update.ts`) reconciles an array-valued interpolation by mapping each item to exactly **one** live node (`Element`, `Comment`, or `Text`). An item whose resolved value is itself an array of nodes — the root of a fragment-rooted region (named slots) or a fragment-template component — falls through the element/comment checks into `getNewTextValue`, which coerces it with `String(nodes)`. The result is literal `"[object Text],[object HTMLDivElement]"` text in the DOM.

History: the named-slots change (`2026-08-07-add-named-slots`) fixed the sibling single-value bug (top-level fragment slot anchored on `parentElement`) and explicitly left this one, calling it "real reconciliation work, not a one-word anchor fix". The element-syntax umbrella (`2026-08-16-element-syntax-first`, Decision 7) documented arrays-of-regions as unsupported and deferred the fix. The documented workaround — interpolate regions in templates (`${slots.col1}`) — is what pink components use today.

Relevant invariants already specified in `activity-array-reactivity`:

- Per-item child contexts keyed by snapshot `key` (falsy keys included) with index fallback.
- Keyed items reuse their DOM node across reorders; unkeyed items reconcile by index.
- Array slots get a persistent parent context, so item contexts (and their nodes) survive re-reconciliation.

The context layer needs no changes — `appendChildContext`/`getContextForValue` operate on the unresolved item (a `ContextFunction`) before any DOM decisions. Only the DOM bookkeeping after `resolveValue` is single-node-shaped.

## Goals / Non-Goals

**Goals:**

- An array item resolving to a node array renders all its nodes in place, in order — behaviorally equivalent to interpolating the same region directly.
- The group reconciles as a unit: update, reorder, truncation, and kind changes affect all of the item's nodes together.
- Existing single-node item behavior (element, comment, text) is byte-for-byte unchanged in the DOM.
- Keep the size delta small and measured (min+gzip of `dist`, same measurement as prior core changes).

**Non-Goals:**

- No diffing **within** a group: a fragment-rooted item's internal updates are owned by its own context/effects, exactly as for a single-element item. The array layer only places and removes the group.
- No changes to `resolveValue`, `compile-component-tags`, or the single-value paths (`updateLiveNode` semantics for non-array values).
- No public API change; no new authoring syntax.

## Decisions

### Decision 1: Fix lives in `handleArrayValue` with nested-group bookkeeping

The live-node array learns to hold, per item, either a single `TemplateRoot` **or** a group (`TemplateRoot[]`). When a resolved item is an array, its nodes are coerced individually (element/comment kept, everything else to `Text`) and inserted as a contiguous run before the cursor; the group is stored as one entry so index math stays 1:1 with `valueArray`.

Alternatives rejected:

- **Marker comments per item** (anchor `Comment` bracketing each group): adds permanent DOM noise to every array render, and the markers themselves would need the same bookkeeping — it relocates the complexity into the document.
- **Flattening group nodes into the live array**: destroys the 1:1 item↔entry correspondence that the cursor/splice logic, keyed reuse, and cleanup all depend on; reorders and truncation become ambiguous.

### Decision 2: Group identity is its first node

`isSameNode`/`includes`/`indexOf` checks generalize to: a group matches when its **first node** is the same node as the candidate group's first. This is sound because a fragment-rooted item with a persistent child context resolves to the **same node instances** across updates (the `activity-array-reactivity` persistent-context requirements guarantee it); a changed first node means a genuinely new/replaced item. Reorder moves the whole run (`insertBefore` each node of the group, in order, before the cursor); the cursor for the next item is the first node of the entry at the target index, flattened.

### Decision 3: Empty groups hold their slot with an empty text node

A fragment-rooted item may resolve to zero nodes (e.g. a region whose content is conditionally empty). The group keeps one empty `Text` node as its anchor — mirroring the existing empty-`valueArray` guard — so later updates still have a live cursor position and the entry count stays aligned with `valueArray`.

### Decision 4: The nested shape stays internal to the templating layer

`TemplateRootArray` remains `TemplateRoot[]` in the public type surface (`ctx.root`, `ContextNodeGetter` consumers). The nested entry shape (`TemplateRoot | TemplateRoot[]`) exists only in `get-text-update.ts`'s closure round-trip (`getTextUpdate` → `textUpdater` → next update) and in `updateLiveNode`'s cleanup path, which must flatten entries when an array value is replaced by a single value. Implementation verifies no other consumer receives the nested shape (audit `set-updates-for-paths.ts`, `context/`, `hydrate`); if one does, widening the public type is a fallback, not the default.

### Decision 5: Size discipline — measure, don't budget-breach silently

Prior core changes carried min+gzip budgets and recorded breaches explicitly. This change measures the `@loom-js/core` dist bundle (min+gzip, same command as the named-slots change) before and after; target is ≤ 256 B growth. If the measured delta exceeds it, record the breach and the reason in the tasks' verification notes rather than trimming semantics to fit.

## Risks / Trade-offs

- **[Cursor/splice complexity]** The existing move logic (`includes`/`splice`/`insertBefore`) is subtle; generalizing to groups risks off-by-one insertions with mixed single/group arrays. → Mitigation: specs cover mixed arrays, reorders, truncation, and growth; tests assert exact `childNodes` order, not just membership.
- **[Group nodes re-inserted on no-op updates]** The non-element branch today re-inserts text nodes every pass; a naive group path could do the same for fragment items, causing churn. → Mitigation: the first-node identity check (Decision 2) skips insertion when the group is already live at its index, matching the element fast path.
- **[Escaping nested shape]** If a nested entry leaks into `ctx.root` or hydration paths, downstream `isSameNode`/`remove` calls throw. → Mitigation: Decision 4's consumer audit is an explicit task; `type-check` plus the full core suite gate the change.
- **[Interaction with keyed reorder logic]** Keyed reuse currently tracks element nodes; groups must participate without breaking the numeric-key and falsy-key guarantees. → Mitigation: the delta spec extends the reorder scenarios to fragment-rooted items; existing keyed specs must stay green untouched.

## Open Questions

None — the approach was scoped by the two prior changes; remaining unknowns (consumer audit outcome, measured size delta) are verification tasks, not design blockers.
