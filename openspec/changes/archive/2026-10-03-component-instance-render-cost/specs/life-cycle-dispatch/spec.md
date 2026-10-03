## ADDED Requirements

### Requirement: Life-cycle events dispatch directly on a state change

Setting an instance's life-cycle state SHALL run that event's handlers in registration order and then the handler registered through the component's `ref`, synchronously, with the instance root as the argument. Setting the state to the value it already holds SHALL run nothing. No reactive proxy or effect SHALL exist per instance for this dispatch.

#### Scenario: Handlers run in order, ref last

- **WHEN** a component registers two `onMounted` handlers and its parent registers one through a `ref`, and the component mounts
- **THEN** the component's handlers run in registration order, then the ref's

#### Scenario: Repeating a state is silent

- **WHEN** a mounted component's node is moved within the document and observed as added again
- **THEN** its `onMounted` handlers do not run a second time

#### Scenario: Server renders dispatch without an observer

- **WHEN** a component renders through `renderToString`
- **THEN** `onCreated`, `onBeforeRender` and `onRendered` run, and `onMounted`/`onUnmounted` never do
