## MODIFIED Requirements

### Requirement: Detached contexts stop receiving activity updates

When a component's root is removed from the document (and not re-inserted within the same mutation batch), its activity-effect subscriptions SHALL be disposed and its entries released from activity scoped-action registries, so subsequent activity updates do not re-run its render effects. Registered roots inside an added or removed subtree SHALL be found by checking the node itself and then walking its descendant elements in document order, creating no collection, node list or tree walker per node; a mutation batch SHALL skip the scan entirely while no context is registered.

#### Scenario: Unmounted component's effect no longer re-runs

- **WHEN** a component rendering an `activity.effect` is removed from the document and the activity is subsequently updated
- **THEN** the removed component's effect action is not invoked for that update

#### Scenario: Teardown cascades to child contexts

- **WHEN** a component whose children also subscribe via `activity.effect` is removed from the document
- **THEN** the child subscriptions are disposed along with the parent's

#### Scenario: Nested and fragment-rooted components are still found

- **WHEN** a removed subtree contains a component nested several elements deep and a fragment-rooted component whose first node is a text node
- **THEN** both contexts are torn down and both `onUnmounted` handlers run

#### Scenario: The scan allocates nothing per node

- **WHEN** nodes holding registered roots are added to and removed from the observed root
- **THEN** every root's `onMounted` and `onUnmounted` handlers run, and no element collection, node list or tree walker is created for the scan

#### Scenario: Empty registry skips the scan

- **WHEN** no component context is registered and nodes are added to or removed from the observed root
- **THEN** the mutation batch reads no descendant of the mutated nodes

#### Scenario: Nested roots keep document order in a bulk removal

- **WHEN** a list is cleared and one of its items holds a nested component
- **THEN** the handlers run in document order — each item, then the components under it, before the next item

#### Scenario: A root placed under a removed node from outside is still found

- **WHEN** a component's root is moved by DOM calls into a list item that belongs to another context, and the list is then cleared
- **THEN** the moved component's `onUnmounted` handler runs
