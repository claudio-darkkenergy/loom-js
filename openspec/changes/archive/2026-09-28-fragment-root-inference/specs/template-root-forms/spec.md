## ADDED Requirements

### Requirement: The root form is inferred from the parsed template

The parser SHALL classify every template from its parsed top-level nodes, ignoring whitespace-only text nodes: a top level consisting of exactly one element SHALL be single-rooted; any other top level — several nodes, non-whitespace text, a comment, or a dynamic slot — SHALL be fragment-rooted. No authoring token SHALL participate in the classification.

#### Scenario: One element is a single root

- **WHEN** a template's top level is one element (surrounded by any amount of whitespace)
- **THEN** the component is single-rooted and `node()` returns that element

#### Scenario: Several top-level nodes make a fragment

- **WHEN** a template's top level holds more than one element, or an element beside non-whitespace text
- **THEN** the component is fragment-rooted and `node()` returns an array of every top-level node in DOM order

#### Scenario: A lone top-level interpolation is a fragment root

- **WHEN** a template's top level is a single interpolated value (e.g. `` html`${Child()}` ``)
- **THEN** the value renders in place as a fragment-rooted component, and life-cycle handlers receive the rendered node(s) as an array

#### Scenario: Component-only templates need no token

- **WHEN** a template's top level is only component elements (and whitespace)
- **THEN** it renders as a fragment without the compiler inserting any prefix into the template statics

### Requirement: Compiled regions are fragments by flag

Synthesized children and named-slot regions SHALL render as fragment-rooted regardless of their node count, signalled by an explicit compiler-set flag on the region's plan — never by prefixing the region's template statics.

#### Scenario: One-element region stays a fragment

- **WHEN** a component element's children consist of a single element
- **THEN** the `children` region still reconciles as a fragment group, and the region's statics contain no inserted token
