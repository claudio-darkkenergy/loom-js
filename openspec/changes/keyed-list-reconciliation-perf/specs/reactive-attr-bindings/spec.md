## MODIFIED Requirements

### Requirement: Attribute bindings track their activity

An attribute whose template value is `activity.bind(select?)` SHALL render with the projected current value immediately and SHALL update to each new projected value when the activity updates — without re-rendering the component or replacing the element. An update whose projection is the same value as the one last applied SHALL leave the attribute untouched.

#### Scenario: Binding applies immediately and stays live

- **WHEN** a component renders an attribute bound via `bind` and the activity subsequently updates
- **THEN** the attribute holds the projected initial value at render
- **AND** reflects each new projected value after each update
- **AND** the element keeps its DOM node identity and the component body does not re-run

#### Scenario: Unchanged projection writes nothing

- **WHEN** the activity updates and `select` yields the value already applied
- **THEN** no attribute mutation occurs on the element

#### Scenario: Bindings work inside $attrs

- **WHEN** an `$attrs` object contains a bound entry
- **THEN** that attribute behaves as a live binding while sibling entries behave as today
