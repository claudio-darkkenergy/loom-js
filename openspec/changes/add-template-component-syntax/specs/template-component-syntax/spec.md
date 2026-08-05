## ADDED Requirements

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

### Requirement: Nested markup does not clobber the enclosing context

Compiled child markup SHALL receive its own component context. The transform SHALL NOT emit a nested call to the enclosing component's bound `html`.

#### Scenario: enclosing component survives nested markup

- **WHEN** a component element containing child markup is rendered inside another component
- **THEN** the enclosing component's `root`, `values`, and `chunks` are unchanged by the nested render
- **AND** the enclosing component continues to re-render correctly afterward

#### Scenario: nested markup reuses its context across re-renders

- **WHEN** markup inside a component element is re-rendered — including from an activity effect callback that runs repeatedly
- **THEN** it resolves to the same scoped context each time
- **AND** its DOM nodes are reused rather than recreated

### Requirement: Templates without component elements are unaffected

The transform SHALL be a no-op for templates that contain no component element syntax.

#### Scenario: ordinary template is untouched

- **WHEN** a template contains no interpolation in tag-name position
- **THEN** the markup handed to `createContextualFragment` is identical to what it is today
- **AND** rendering behavior and output are unchanged

#### Scenario: transform cost is paid once per call site

- **WHEN** a template literal containing component elements is rendered many times
- **THEN** the source-text transform is computed once for that call site and reused
- **AND** only the derived interpolation values are recomputed per render

### Requirement: Malformed component syntax fails clearly

Component element syntax outside the supported grammar SHALL produce an actionable error rather than silently mis-rendering.

#### Scenario: unclosed or malformed component element

- **WHEN** a component element is unclosed, or uses an unsupported attribute form
- **THEN** an error identifying the template and the offending construct is raised
- **AND** the failure is not a silent fallthrough that renders nothing
