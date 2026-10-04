## ADDED Requirements

### Requirement: A whole-list replacement is one DOM operation

When a reconciliation pass reuses no previous item and the previous items' nodes (or the slot's placeholder) are all of their parent's children, the pass SHALL replace the parent's children in one `replaceChildren` call instead of removing and inserting node by node. Key reads, child-context release for the replaced keys and the item bookkeeping SHALL be unchanged, and the per-item path SHALL still serve every pass that reuses an item or whose parent holds other nodes.

#### Scenario: Clearing a list is one operation

- **WHEN** a 1 000-item keyed list that fills its parent is replaced by an empty array
- **THEN** the parent's children are replaced in one `replaceChildren` call with no per-node removal, the 1 000 child contexts are released and their `onUnmounted` handlers run

#### Scenario: Replacing every key is one operation

- **WHEN** a 1 000-item keyed list that fills its parent is replaced by 1 000 items with new keys
- **THEN** the parent's children are replaced in one `replaceChildren` call with no per-node insertion, and the old keys' contexts are released

#### Scenario: A parent holding other nodes keeps the per-item path

- **WHEN** a list whose parent also holds a static sibling is replaced by new keys
- **THEN** the static sibling stays in place, the leaving nodes are removed one by one and the new items are inserted before the sibling

### Requirement: Consecutive placements are one insertion

When several consecutive items of the new order need placing before the same following item (new items, or items that moved), the pass SHALL insert their nodes in one operation; items that keep their relative order are still never moved.

#### Scenario: An append is one insertion

- **WHEN** 1 000 keyed items are appended to 1 000 existing ones
- **THEN** the new items' nodes are inserted with one insertion, after the last existing node, and no existing node is moved
