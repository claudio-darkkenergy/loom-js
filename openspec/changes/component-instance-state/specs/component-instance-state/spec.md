## ADDED Requirements

### Requirement: Instance-memoized values survive re-renders

The render function's props SHALL include an instance-memo utility: on a component instance's first render it SHALL invoke the provided factory and cache the result per component context in call order; on every re-render — including parent-triggered re-renders that re-run the render function — it SHALL return the cached value without re-invoking the factory.

#### Scenario: parent re-render preserves the value

- **WHEN** a component creating a local activity through the utility is re-rendered by its parent with new props
- **THEN** the same activity instance is returned and its state is preserved

#### Scenario: instances are isolated

- **WHEN** two instances of the same component render
- **THEN** each holds its own cached values

### Requirement: Call order is the identity

Cached values SHALL be replayed by call order. A render that calls the utility in a different count or order than the instance's first render is misuse: the framework SHALL surface a debug-lane warning when the replay over- or under-runs, and the documented rule SHALL require unconditional, same-order calls.

#### Scenario: overrun warns

- **WHEN** a re-render calls the utility more times than the first render did
- **THEN** a debug-lane warning names the mismatch (narration-gated)

### Requirement: Lifetime follows the component context

Cached values SHALL live as long as the component's context — dropped on unmount, isolated per window (server renders included). Disposal of stored resources remains the author's, via `onUnmounted`.

#### Scenario: unmount releases the storage

- **WHEN** a component instance unmounts
- **THEN** its cached values are released with its context
