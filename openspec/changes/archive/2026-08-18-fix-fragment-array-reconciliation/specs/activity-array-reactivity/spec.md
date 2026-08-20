## ADDED Requirements

### Requirement: Fragment-rooted array items render their nodes

An item of a reconciled array whose resolved value is itself an array of nodes — the root of a fragment-rooted region or fragment-template component — SHALL render all of its nodes in the DOM, in order, at the item's position. The item SHALL NOT be coerced to a text node via string conversion. Rendering a fragment-rooted value as a children-array item SHALL be behaviorally equivalent to interpolating the same value directly in a template.

#### Scenario: Fragment-rooted item renders all nodes instead of stringifying

- **WHEN** a component receives `children: [regionA, elementB]` where `regionA` is a fragment-rooted region resolving to multiple nodes
- **THEN** all of `regionA`'s nodes appear in the DOM in order, followed by `elementB`
- **AND** no text content matching `[object ` is rendered

#### Scenario: Array-item and direct interpolation are equivalent

- **WHEN** the same fragment-rooted region is rendered once via direct interpolation (`${region}`) and once as an item of a children array
- **THEN** the resulting DOM subtrees are equivalent (same elements, same order, ignoring whitespace-only text)

### Requirement: Fragment-rooted items reconcile as a unit

Reconciliation SHALL treat a fragment-rooted item's nodes as one group: an update, reorder, or removal of the item SHALL affect all of the group's nodes together, and the group's internal node order SHALL be preserved. Group identity SHALL be judged by the group's first node, so a fragment-rooted item with a persistent child context reuses its live nodes across updates instead of being re-inserted. Removing an item — including truncation when the new array is shorter — SHALL remove every node of that item's group. When an item changes kind between fragment-rooted, single-element, and text values, the previous rendering SHALL be fully replaced by the new kind.

#### Scenario: Reorder moves the whole group and preserves node identity

- **WHEN** an array containing a fragment-rooted item among other items is reordered by an `update()`
- **THEN** all of the fragment item's nodes move together to the new position, in their original internal order
- **AND** each of the group's DOM nodes is the same node instance before and after the update

#### Scenario: Truncation removes every node of a dropped group

- **WHEN** an `update()` shortens the array past a fragment-rooted item
- **THEN** every node of that item's group is removed from the DOM
- **AND** no orphaned nodes from the group remain

#### Scenario: Mixed arrays keep exact child order

- **WHEN** an array mixes single-element items, text items, and fragment-rooted items
- **THEN** the parent's child nodes appear in exactly the array's item order, with each fragment group contiguous

#### Scenario: Kind change replaces the group

- **WHEN** an item that rendered as a fragment group is updated to a single element or text value (or vice versa)
- **THEN** the previous kind's nodes are fully removed
- **AND** the new value renders at the same item position

### Requirement: Empty fragment groups hold their position

A fragment-rooted item that resolves to zero nodes SHALL keep an empty text-node anchor at its position, so the item count stays aligned with the array and a later update that produces nodes renders them at the correct position.

#### Scenario: Empty group re-fills in place

- **WHEN** a fragment-rooted item resolves to no nodes and a later `update()` gives it content, with sibling items on both sides
- **THEN** the new nodes render between the same siblings
- **AND** while empty, the item contributes no visible content
