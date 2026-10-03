## MODIFIED Requirements

### Requirement: Reordered keyed items reuse their own DOM node

When an array of context-function items each supplies a stable `key` — of **either** `string` or `number` type — reconciling a reordered array SHALL reuse each item's existing DOM node (moving it to the new position) rather than repainting the node that happens to occupy the target index, and SHALL move only the items whose relative order changed (see `keyed-list-diffing`). Items without a `key` SHALL retain the existing index-positional behavior.

The former numeric-key limitation is resolved: a pass over already-resolved DOM nodes no longer deletes the child context of a keyed item whose key collides with the index keyspace.

#### Scenario: Keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a stable `key` (string or numeric) and an `update()` reorders the array
- **THEN** the DOM element associated with a given key is the same element instance before and after the update
- **AND** it is moved to the position matching its new index

#### Scenario: Only displaced items move

- **WHEN** a keyed array update swaps two items
- **THEN** no node other than the two swapped items' nodes is re-inserted

#### Scenario: Unkeyed items fall back to index reconciliation

- **WHEN** mapped array items supply no `key`
- **THEN** reconciliation reuses the DOM node at each index and updates it in place (existing behavior, no per-item move)

### Requirement: Context snapshotting must not execute non-snapshotable values

Reading an array item's reconciliation key SHALL NOT invoke the item: a component context function carries its `key` as a property set at creation, and an `activityContextFunction` has no key and reconciles by index. The dry-run snapshot helper remains available to callers that need a full context preview, and it SHALL still only invoke component context functions — never an `activityContextFunction`, which has no dry-run mode and whose execution would set up a reactive subscription on a throwaway context.

#### Scenario: Component context function exposes its key without running

- **WHEN** an array item is a component context function created with a `key` prop
- **THEN** the reconciler reads that key from the function's `key` property and does not invoke it in dry-run mode

#### Scenario: Activity context function is not executed by snapshotting

- **WHEN** an array item is an `activityContextFunction` (the result of `activity.effect(...)`)
- **THEN** the reconciler uses its index as the key and the snapshot helper, if called, returns an empty snapshot without invoking it
- **AND** no reactive subscription or render is triggered as a side effect
