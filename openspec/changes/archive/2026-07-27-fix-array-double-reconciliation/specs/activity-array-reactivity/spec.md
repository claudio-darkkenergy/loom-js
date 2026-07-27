## MODIFIED Requirements

### Requirement: Reordered keyed items reuse their own DOM node

When an array of context-function items each supplies a stable `key` — of **either** `string` or `number` type — reconciling a reordered array SHALL reuse each item's existing DOM node (moving it to the new position) rather than repainting the node that happens to occupy the target index. Items without a `key` SHALL retain the existing index-positional behavior.

The former numeric-key limitation is resolved: a pass over already-resolved DOM nodes no longer deletes the child context of a keyed item whose key collides with the index keyspace.

#### Scenario: Keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a stable `key` (string or numeric) and an `update()` reorders the array
- **THEN** the DOM element associated with a given key is the same element instance before and after the update
- **AND** it is moved to the position matching its new index

#### Scenario: Unkeyed items fall back to index reconciliation

- **WHEN** mapped array items supply no `key`
- **THEN** reconciliation reuses the DOM node at each index and updates it in place (existing behavior, no per-item move)

## ADDED Requirements

### Requirement: Effect-owned array subtree is reconciled once per update

An array produced by an `activity.effect(...)` SHALL be reconciled exactly once per update by the effect that owns it. The outer `${...}` interpolation SHALL NOT re-reconcile the effect's already-resolved DOM elements into the effect's child-context map. In particular, a reconciliation pass over resolved DOM elements SHALL NOT delete a child context that was created for a keyed context-function item.

#### Scenario: No destructive re-reconciliation of resolved elements

- **WHEN** an `activity.effect(...)` renders an array of keyed items and the surrounding component update triggers the outer interpolation
- **THEN** the effect's `children` map still contains a child context for every live key
- **AND** no child context created for a keyed item is deleted by a pass over resolved DOM elements

#### Scenario: Single reconciliation per update

- **WHEN** an array-valued `activity.effect(...)` re-runs due to an `update()`
- **THEN** each array item's context function is resolved once for that update
- **AND** the array is not reconciled a second time against its own resolved output

### Requirement: Numeric keys reuse their DOM node across a reorder

Per-item DOM node reuse across a reorder SHALL hold for **numeric** keys as well as string keys. A numeric `key` whose value equals an array index SHALL NOT lose its child context, and reordering a numeric-keyed list SHALL reuse each item's existing DOM node.

#### Scenario: Numeric-keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a numeric `key` (e.g. `1, 2, 3`) and an `update()` reorders the array (e.g. to `3, 2, 1`)
- **THEN** the DOM element associated with a given numeric key is the same element instance before and after the update
- **AND** it is moved to the position matching its new index

#### Scenario: Numeric key equal to an index is not collapsed or deleted

- **WHEN** a keyed item uses a numeric key equal to an array index (e.g. key `1` at some position)
- **THEN** its child context is preserved across re-reconciliation
- **AND** the item is not recreated on the next reorder
