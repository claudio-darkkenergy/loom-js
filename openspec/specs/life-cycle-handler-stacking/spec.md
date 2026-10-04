# life-cycle-handler-stacking Specification

## Purpose

TBD - created by archiving change stackable-life-cycle-hooks. Update Purpose after archive.

## Requirements

### Requirement: Life-cycle handlers stack in registration order

Every call to a component's life-cycle setter (`onCreated`, `onBeforeRender`, `onRendered`, `onMounted`, `onUnmounted`) during the render that registers that event SHALL append the handler to the event's list, and the event SHALL invoke every handler in the list in registration order with the component's root. A component and the hooks it calls SHALL each be able to register for the same event. An event's list SHALL exist from its first registration; an instance that registers nothing for an event holds no list for it.

#### Scenario: a component and a hook both register the same event

- **WHEN** a component calls `onMounted(a)` and then a hook it invokes calls `onMounted(b)` in the same render
- **THEN** on mount `a` runs, then `b`

#### Scenario: two hooks register the same event

- **WHEN** two hooks a component calls each register `onUnmounted` in the same render
- **THEN** on unmount both handlers run, in the order the hooks were called

#### Scenario: Unregistered events allocate nothing

- **WHEN** a component registers only `onMounted`
- **THEN** its context holds a handler list for `mounted` and none for the other four events

### Requirement: An event's handler list locks after its registering render

Once a render in which an event received at least one registration ends, the event's list SHALL be fixed: setter calls for that event in later renders SHALL be no-ops. An event with no handlers SHALL accept registrations in any render.

#### Scenario: re-render registrations are no-ops

- **WHEN** a component that registered `onRendered(a)` on its first render re-renders and calls `onRendered(b)`
- **THEN** `a` runs on each render and `b` never runs

#### Scenario: an event first registered on a later render is honored

- **WHEN** a component registers `onRendered` only from its second render onward
- **THEN** that handler is registered by the second render and fires on that render and every later one

### Requirement: Ref handlers run after the component's own

A handler registered through the component's `ref` SHALL fire after the component's own handlers for that event, and SHALL NOT prevent the component from registering its own handlers for that event.

#### Scenario: child and parent-ref handlers both fire

- **WHEN** a parent registers `onMounted` on a `ref` it passes to a child, and the child registers its own `onMounted`
- **THEN** on mount the child's handler runs, then the ref's handler
