## ADDED Requirements

### Requirement: Children distribute into named regions by `slot` label

A component SHALL be able to receive multiple labelled content regions: children markup carrying a `slot="name"` label is grouped by name, and the component can render each named region independently of the others.

#### Scenario: labelled children reach their named region

- **WHEN** a component element wraps children where some top-level elements carry `slot="header"` and `slot="footer"` labels
- **THEN** the component renders the `header`-labelled content in the position it designates for `header`, and likewise for `footer`
- **AND** each region renders in its own component context

#### Scenario: unlabelled children remain the default region

- **WHEN** a component's children mix `slot`-labelled elements with unlabelled markup
- **THEN** the unlabelled markup reaches the component as its ordinary `children`, with the labelled elements removed from it

#### Scenario: an absent region renders nothing

- **WHEN** a component designates a named region and the caller supplies no content with that label
- **THEN** that region renders nothing
- **AND** no error is raised

### Requirement: Light-DOM distribution is loom's; shadow-DOM distribution is the platform's

Distribution of `[slot]`-labelled content SHALL be performed by loom for components rendering into the light DOM, and SHALL be left to the platform's native `<slot>` mechanism for components rendering into a shadow root.

#### Scenario: light-DOM component distributes without shadow DOM

- **WHEN** a component that renders into the light DOM (the default) receives `slot`-labelled children
- **THEN** the labelled content is distributed into the component's named regions with no shadow root involved

#### Scenario: shadow-DOM element defers to native slots

- **WHEN** a `defineElement` component that opted into `shadow` receives `slot`-labelled children
- **THEN** the labelled elements reach the shadow host as ordinary light-DOM children
- **AND** the platform's native `<slot>` distribution applies, undisturbed by loom

### Requirement: Both composition forms express named regions

Named regions SHALL be expressible from element syntax and from the functional form, producing equivalent results.

#### Scenario: element syntax labels regions in markup

- **WHEN** a template composes `<${Card}><h2 slot="header">Title</h2><p>Body</p></>`
- **THEN** the component receives `header` as a named region and the paragraph as `children`

#### Scenario: functional form supplies the same regions

- **WHEN** the same component is composed functionally with the equivalent region-bearing arguments
- **THEN** the rendered output is equivalent to the element-syntax form

### Requirement: Malformed slot usage fails clearly

Slot labels outside the accepted grammar SHALL raise an actionable error rather than silently mis-distributing.

#### Scenario: unsupported slot-label form throws

- **WHEN** a template uses a `slot` label in a form outside the accepted grammar
- **THEN** an error identifying the offending construct is raised at the earliest stage that can detect it
- **AND** the failure is not a silent fallthrough that renders content in the wrong region
