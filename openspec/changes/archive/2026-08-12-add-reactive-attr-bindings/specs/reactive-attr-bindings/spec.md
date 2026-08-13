## ADDED Requirements

### Requirement: Attribute bindings track their activity

An attribute whose template value is `activity.bind(select?)` SHALL render with the projected current value immediately and SHALL update to each new projected value when the activity updates — without re-rendering the component or replacing the element.

#### Scenario: Binding applies immediately and stays live

- **WHEN** a component renders an attribute bound via `bind` and the activity subsequently updates
- **THEN** the attribute holds the projected initial value at render
- **AND** reflects each new projected value after each update
- **AND** the element keeps its DOM node identity and the component body does not re-run

#### Scenario: Bindings work inside $attrs

- **WHEN** an `$attrs` object contains a bound entry
- **THEN** that attribute behaves as a live binding while sibling entries behave as today

### Requirement: Binding subscriptions never stack and are torn down

Each attr slot SHALL hold at most one live binding subscription: re-renders that replace a binding (with a new binding or a plain value) SHALL dispose the previous subscription, and unmounting the component SHALL dispose it via context teardown.

#### Scenario: Re-render swaps dispose the old subscription

- **WHEN** a component re-renders a bound attribute N times
- **THEN** a subsequent activity update changes the attribute exactly once

#### Scenario: Unmount releases the binding

- **WHEN** a component with a bound attribute is removed from the document and the activity later updates
- **THEN** no attribute update occurs and the subscription is released
