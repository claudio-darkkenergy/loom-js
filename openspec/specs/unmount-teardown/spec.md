## Purpose

Defines automatic resource release for unmounted components: when a component's root is genuinely detached from the document (checked at the end of each mutation batch, so same-batch moves don't count), its activity-effect subscriptions are disposed and released from activity scoped-action registries, cascading through its child contexts. Moved-but-attached components keep their subscriptions and lifecycle registration — `onUnmounted` fires only for genuine removals — and torn-down contexts re-subscribe cleanly when rendered again.

This capability covers context-managed subscriptions (`activity.effect`) in `@loom-js/core`, building on the manual-disposal contract of `reactive-unsubscribe`; caller-managed `watch` subscriptions remain the caller's responsibility.

## Requirements

### Requirement: Detached contexts stop receiving activity updates

When a component's root is removed from the document (and not re-inserted within the same mutation batch), its activity-effect subscriptions SHALL be disposed and its entries released from activity scoped-action registries, so subsequent activity updates do not re-run its render effects. Registered roots inside an added or removed subtree SHALL be found by checking the node itself and then one element query over its descendants per node — never a script-stepped walk — and a mutation batch SHALL skip the scan entirely while no context is registered.

#### Scenario: Unmounted component's effect no longer re-runs

- **WHEN** a component rendering an `activity.effect` is removed from the document and the activity is subsequently updated
- **THEN** the removed component's effect action is not invoked for that update

#### Scenario: Teardown cascades to child contexts

- **WHEN** a component whose children also subscribe via `activity.effect` is removed from the document
- **THEN** the child subscriptions are disposed along with the parent's

#### Scenario: Nested and fragment-rooted components are still found

- **WHEN** a removed subtree contains a component nested several elements deep and a fragment-rooted component whose first node is a text node
- **THEN** both contexts are torn down and both `onUnmounted` handlers run

#### Scenario: Empty registry skips the scan

- **WHEN** no component context is registered and nodes are added to or removed from the observed root
- **THEN** the mutation batch performs no subtree query

### Requirement: Moved components are not torn down

A component whose root is removed and re-inserted while remaining in the document at the end of the mutation batch (a move, e.g. an array reorder) SHALL NOT fire `'unmounted'`, SHALL keep its lifecycle registration, and SHALL keep receiving activity updates.

#### Scenario: Array reorder preserves subscriptions and lifecycle

- **WHEN** an array-valued slot reorders its items, moving a component's root via re-insertion
- **THEN** the component's `onUnmounted` handler is not invoked
- **AND** a subsequent activity update still re-runs the component's effect
- **AND** a later genuine removal still invokes `onUnmounted`

### Requirement: Torn-down contexts re-subscribe on remount

A context that was torn down SHALL re-register its activity-effect subscription when it renders again, receiving updates exactly once per update thereafter.

#### Scenario: Remount after teardown resumes updates without duplication

- **WHEN** a torn-down component is mounted again and the activity is updated
- **THEN** its effect action is invoked exactly once for that update

### Requirement: A remount registers fresh life-cycle handlers

When a context is torn down, the life-cycle handlers its component registered SHALL be dropped — every event's handler list cleared — so the render that remounts it registers its own. Handlers given through the component's `ref` SHALL stay. Every `onUnmounted` handler in a mutation batch SHALL fire before any context in that batch is torn down.

#### Scenario: Remount runs the handlers from its own render

- **WHEN** a component that registers `onCreated` twice (its own handler and a hook's) is unmounted and mounted again
- **THEN** both handlers registered by the remount's render are invoked, in order
- **AND** no handler registered by the first render is invoked again

#### Scenario: A ref handler survives a remount

- **WHEN** a parent registers `onCreated` on a `ref` it passes to a child, and the child is unmounted and mounted again
- **THEN** the ref's handler is invoked for both creations

#### Scenario: A child's unmount handler fires when its parent is removed

- **WHEN** a component whose child registers `onUnmounted` is removed from the document
- **THEN** the child's `onUnmounted` handler is invoked once
