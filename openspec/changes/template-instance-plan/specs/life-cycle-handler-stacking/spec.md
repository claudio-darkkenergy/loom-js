## MODIFIED Requirements

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
