## ADDED Requirements

### Requirement: Children distribute into named regions by `slot` label

A component SHALL be able to receive multiple labelled content regions: children markup carrying a `slot="name"` label is grouped by name, and the component can render each named region independently of the others.

#### Scenario: labelled children reach their named region

- **WHEN** a component element wraps children where some top-level elements carry `slot="header"` and `slot="footer"` labels
- **THEN** the component receives each named region as a `ContextFunction` under `props.slots` (`slots.header`, `slots.footer`) and renders it by interpolation (design Decision 3)
- **AND** each region renders in its own component context

#### Scenario: unlabelled children remain the default region

- **WHEN** a component's children mix `slot`-labelled elements with unlabelled markup
- **THEN** the unlabelled markup reaches the component as its ordinary `children`, with the labelled elements removed from it

#### Scenario: an absent region renders nothing

- **WHEN** a component designates a named region and the caller supplies no content with that label
- **THEN** that region's key is absent from `slots` and its interpolation renders nothing
- **AND** no error is raised

#### Scenario: a labelled component element becomes region content

- **WHEN** a top-level child of a component element is itself a component element carrying a static `slot="name"` prop
- **THEN** the compiled component becomes the content of region `name`
- **AND** the `slot` prop is consumed as addressing — the component does not receive a `slot` prop

#### Scenario: same-label siblings concatenate in source order

- **WHEN** multiple top-level elements of a children region carry the same `slot="name"` label
- **THEN** all of them render in region `name`, in source order

#### Scenario: labelled elements keep their `slot` attribute

- **WHEN** a `slot`-labelled plain element is distributed into a named region
- **THEN** the rendered element still carries its `slot` attribute, inert in the light DOM — exactly as the platform leaves it on natively assigned nodes

#### Scenario: only top-level elements are labels

- **WHEN** a `slot` attribute appears on an element nested deeper than the children region's top level (e.g. inside a wrapper element or a nested custom element)
- **THEN** it is not treated as a region label — it passes through untouched with its native meaning
- **AND** top-level text and interpolations are never labelled; they belong to the unlabelled remainder

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

- **WHEN** the same component is composed functionally as `Card({ slots: { header: … }, children: … })` — the exact call shape the element syntax compiles to (design Decision 5)
- **THEN** the rendered output is equivalent to the element-syntax form

#### Scenario: markup-derived regions take precedence

- **WHEN** a component element supplies both a `slots=${…}` attribute prop and `slot`-labelled children
- **THEN** the labelled children win — mirroring how markup children already take precedence over a `children=` attribute

### Requirement: Malformed slot usage fails clearly

Slot labels outside the accepted grammar SHALL raise an actionable error rather than silently mis-distributing.

#### Scenario: unsupported slot-label form throws

- **WHEN** a template uses a `slot` label in a form outside the accepted grammar
- **THEN** an error identifying the offending construct is raised at the earliest stage that can detect it
- **AND** the failure is not a silent fallthrough that renders content in the wrong region

#### Scenario: an interpolated label throws

- **WHEN** a top-level child of a children region carries `slot=${name}` — on a plain element or a component element
- **THEN** the transform throws, naming the construct — labels are grouped at transform time and cannot be dynamic
- **AND** an interpolated `slot` attribute nested deeper than the top level passes through as an ordinary attribute update (it has native meaning there)

#### Scenario: valueless, unquoted, and empty labels throw

- **WHEN** a top-level element of a children region carries `slot`, `slot=name`, or `slot=""`
- **THEN** the transform throws, naming the construct with surrounding text
