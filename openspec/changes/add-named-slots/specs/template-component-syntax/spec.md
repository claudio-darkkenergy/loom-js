## MODIFIED Requirements

### Requirement: Components compose via element syntax

A loom template SHALL support composing a component as an element whose tag is an interpolated component reference, with props supplied as attributes.

#### Scenario: component element renders

- **WHEN** a template contains `<${SomeComponent} />`
- **THEN** the component renders at that position
- **AND** the result is equivalent to interpolating `${SomeComponent({})}` at the same position

#### Scenario: props are passed as attributes

- **WHEN** a component element supplies props as `prop=${value}`, static `attr="text"`, and boolean shorthand `flag`
- **THEN** the component receives them as props with the corresponding values
- **AND** interpolated values preserve their JavaScript type — objects, arrays, and functions are passed by reference, not coerced to strings

#### Scenario: children are passed through

- **WHEN** a component element wraps markup between its opening and closing tags
- **THEN** that markup is available to the component as its `children` prop
- **AND** the markup renders in its own component context, not the enclosing component's
- **AND** any `slot`-labelled top-level elements in that markup are distributed into the component's named regions per the `named-slots` capability, with only the unlabelled remainder forming `children`

#### Scenario: prop names are verbatim

- **WHEN** a component element supplies a prop with a mixed-case name such as `onClick=${fn}`
- **THEN** the component receives the prop under the exact name as authored — no lowercasing, no camelCase conversion

#### Scenario: `key` is an ordinary prop

- **WHEN** a component element supplies `key=${id}` or `key="static"`
- **THEN** the value reaches the component's `props.key`
- **AND** it participates in keyed reconciliation exactly as `Component({ key })` does

#### Scenario: children of keyed items reconcile with their parents

- **WHEN** a keyed list item's template composes a component element with children markup, and the list is reordered
- **THEN** the children's DOM nodes move with their keyed parent rather than being recreated
- **AND** no `key` needs to be supplied on the inner component element (design Decision 10)
