## Purpose

Defines the project's obligations for composing components inside loom templates using element syntax — `<${Component} prop=${value}>…</>` as pure sugar over the `${Component({ … })}` functional form, with no new runtime semantics. Covers the prop forms and their verbatim naming, the single `</>` closing form, children compiling into their own component context, `key` behaving as an ordinary prop, the zero-cost guarantee for templates that use no component tags, and the throw-on-malformed contract that prevents silent mis-rendering.

This capability targets **authoring ergonomics** inside loom templates. Exposing components to non-loom pages is the separate `custom-element-registration` capability.

## Requirements

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

### Requirement: `</>` is the single closing form

A component element SHALL close with `</>` and nothing else.

#### Scenario: `</>` closes the innermost open component element

- **WHEN** a template contains `<${Panel}>…</>`
- **THEN** the markup between the tags becomes `Panel`'s children
- **AND** nesting resolves innermost-first

#### Scenario: `</${Component}>` is not accepted

- **WHEN** a template closes a component element as `</${Component}>`
- **THEN** an error is raised at transform time naming the rejected closing form

#### Scenario: `<//>` is not accepted

- **WHEN** a template closes a component element as `<//>`
- **THEN** an error is raised at transform time naming the rejected closing form

#### Scenario: `</>` with no open component element

- **WHEN** `</>` appears in a component-bearing template while no component element is open
- **THEN** an error is raised at transform time stating that no component tag is open

### Requirement: `$` is element-only

Component-element attributes SHALL NOT carry the `$` sigil; `$` keeps its existing special-attribute meaning on real elements only.

#### Scenario: `$`-prefixed prop throws

- **WHEN** a component element supplies `$onClick=${fn}`
- **THEN** an error is raised at transform time suggesting the unprefixed name `onClick`

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

#### Scenario: unsupported attribute forms throw

- **WHEN** a component element uses an unquoted static value (`a=b`), an interpolation inside a quoted value (`a="x ${y}"`), or an interpolation that is not immediately after `name=`
- **THEN** an error is raised at transform time naming the offending construct and including the surrounding chunk text

#### Scenario: non-callable tag value throws

- **WHEN** the interpolated tag value of a component element is not a function at render time
- **THEN** an error is raised naming the interpolation position
