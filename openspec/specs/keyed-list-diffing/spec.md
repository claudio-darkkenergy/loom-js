# keyed-list-diffing Specification

## Purpose

Defines the keyed array reconciliation in `@loom-js/core`: previous items indexed by key once per pass, keys read from the context function without rendering, moves limited to the items whose relative order changed (longest increasing subsequence of previous positions), and removed keys releasing their child context. Builds on `activity-array-reactivity`, which owns the array-slot persistence and grouping rules.

## Requirements

### Requirement: Keyed reconciliation indexes old items by key

Reconciling a keyed array SHALL build one key-to-entry index of the previous pass and resolve each new item against it in constant time; the pass SHALL be linear in the number of items plus the number of moves.

#### Scenario: No per-item scan

- **WHEN** 1 000 keyed items are reconciled after one item is removed
- **THEN** the pass performs no linear search per item (no `findIndex`-style scan), and completes in time proportional to the item count

### Requirement: Reorders move only the items that changed relative order

For items present in both passes, reconciliation SHALL leave in place every item whose relative order is preserved (a longest increasing subsequence of previous positions) and SHALL move only the rest, each with a single DOM insertion.

#### Scenario: Swap moves two nodes

- **WHEN** a 1 000-item keyed list swaps items 1 and 998
- **THEN** at most two row nodes are re-inserted and the other 998 are not touched

#### Scenario: Removal moves nothing

- **WHEN** one item is removed from the middle of a keyed list
- **THEN** exactly that item's nodes are removed and no other node is re-inserted

#### Scenario: Append inserts only the new items

- **WHEN** 1 000 keyed items are appended to 1 000 existing ones
- **THEN** only the 1 000 new items' nodes are inserted and no existing node is moved

### Requirement: Keys are read without rendering

A component context function SHALL expose its `key` as a property set at creation, and the reconciler SHALL read that property instead of invoking the function to obtain it. Values without a key SHALL use their index.

#### Scenario: Reconciling allocates no throwaway context

- **WHEN** a keyed array of component context functions is reconciled
- **THEN** no component is invoked in dry-run mode to learn its key

#### Scenario: Activity context functions keep index keys

- **WHEN** an array item is an activity context function
- **THEN** it reconciles by index and is never invoked to read a key

### Requirement: Removed keys release their child context

When a key present in the previous pass is absent from the new one, reconciliation SHALL remove that item's nodes and delete its child context from the parent's `children` map in the same pass.

#### Scenario: Context map does not grow

- **WHEN** a keyed list replaces all 1 000 items with 1 000 new keys, three times
- **THEN** the parent's `children` map holds exactly 1 000 entries afterwards

#### Scenario: Teardown still fires

- **WHEN** a keyed item is removed
- **THEN** its `onUnmounted` handler runs and its activity subscriptions are disposed, as the teardown spec requires
