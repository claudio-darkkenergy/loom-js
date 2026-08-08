## MODIFIED Requirements

### Requirement: Components compose via element syntax

A loom template SHALL support composing a component as an element whose tag is an interpolated component reference, with props supplied as attributes, including spreading an interpolated object's entries as props.

#### Scenario: spread props apply in source order

- **WHEN** a component element supplies `...${object}` among its attributes
- **THEN** the object's entries become props exactly as `Component({ ...object })` would receive them
- **AND** spreads and named props apply in authored order with last-wins duplicates, like an object literal

#### Scenario: nullish spread values are a no-op

- **WHEN** the interpolated spread value is `null`, `undefined`, or a primitive
- **THEN** no props are added and no error is raised — matching JS object-spread semantics

#### Scenario: spread values carry no transform-time constructs

- **WHEN** a spread object contains a `slot` key
- **THEN** it arrives as an ordinary prop named `slot`, never as a region label
- **AND** markup-derived `children` and `slots` still take precedence over spread-supplied ones

### Requirement: Malformed component syntax fails clearly

Component element syntax outside the supported grammar SHALL produce an actionable error rather than silently mis-rendering, with `...` immediately before an interpolation no longer among the rejected forms.

#### Scenario: `...` not followed by an interpolation throws

- **WHEN** `...` appears in an attribute region other than immediately before an interpolation
- **THEN** an error is raised at transform time naming the offending construct
