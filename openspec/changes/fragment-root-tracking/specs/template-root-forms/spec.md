# Spec Delta

## ADDED Requirements

### Requirement: A fragment root follows its live nodes

A fragment-rooted instance's node list SHALL match its live top-level nodes in DOM order after every change, not only at first render. When a top-level slot replaces, adds or removes nodes — through the instance's own re-render or through an activity effect that re-renders on its own — the instance's list SHALL reflect the change before the next read, and so SHALL the list of every fragment-rooted ancestor whose top level contains that slot. `node()`, life-cycle handlers, the check that decides whether an instance updates in place, and a keyed list moving the instance SHALL all use the current list.

#### Scenario: A top-level effect swaps its content

- **WHEN** a fragment-rooted component's top level is an activity effect, the effect re-renders to different nodes, and the component is then re-rendered with new props
- **THEN** the component updates in place, its effect's current content stays in the document, and `node()` returns the effect's current nodes

#### Scenario: A top-level list grows and shrinks

- **WHEN** a fragment-rooted component's top level is a list that re-renders from one item to three, then back to one
- **THEN** `node()` returns the three item nodes after the first change and the one item node after the second

#### Scenario: A nested fragment changes inside a fragment

- **WHEN** a fragment-rooted child sits at the top level of a fragment-rooted parent and the child's nodes change through its own effect
- **THEN** the parent's `node()` returns the child's current nodes in place of the old ones

#### Scenario: A keyed list moves a fragment-rooted item

- **WHEN** a keyed list reorders an item whose fragment root has gained nodes since first render
- **THEN** every current node of that item moves together and no stale node is reinserted

#### Scenario: Life-cycle handlers receive the current nodes

- **WHEN** a fragment-rooted instance whose top-level nodes have changed renders again
- **THEN** its `onRendered` handlers receive the current node list
