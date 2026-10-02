## MODIFIED Requirements

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
