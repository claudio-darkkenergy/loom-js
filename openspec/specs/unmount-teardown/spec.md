## Purpose

Defines automatic resource release for unmounted components: when a component's root is genuinely detached from the document (checked at the end of each mutation batch, so same-batch moves don't count), its activity-effect subscriptions are disposed and released from activity scoped-action registries, cascading through its child contexts. Moved-but-attached components keep their subscriptions and lifecycle registration — `onUnmounted` fires only for genuine removals — and torn-down contexts re-subscribe cleanly when rendered again.

This capability covers context-managed subscriptions (`activity.effect`) in `@loom-js/core`, building on the manual-disposal contract of `reactive-unsubscribe`; caller-managed `watch` subscriptions remain the caller's responsibility.

## Requirements

### Requirement: Detached contexts stop receiving activity updates

When a component's root is removed from the document (and not re-inserted within the same mutation batch), its activity-effect subscriptions SHALL be disposed and its entries released from activity scoped-action registries, so subsequent activity updates do not re-run its render effects.

#### Scenario: Unmounted component's effect no longer re-runs

- **WHEN** a component rendering an `activity.effect` is removed from the document and the activity is subsequently updated
- **THEN** the removed component's effect action is not invoked for that update

#### Scenario: Teardown cascades to child contexts

- **WHEN** a component whose children also subscribe via `activity.effect` is removed from the document
- **THEN** the child subscriptions are disposed along with the parent's

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
