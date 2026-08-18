## Purpose

Defines how first-party UI code is authored: composition — elements, attributes, children, named slots — is written as element-syntax template markup rather than through the `@loom-js/tags` wrapper layer, with the functional form reserved for genuine value positions (effect returns, map callbacks, element-as-value props). Covers the retirement of `@loom-js/tags` from first-party code and from the repository.

Spun out of the `element-syntax-conversion` change.

## Requirements

### Requirement: First-party UI code authors composition in element syntax

Pink components and first-party apps SHALL author composition as template markup — elements, attributes, children, named slots — reserving the functional form for genuine value positions (effect returns, map callbacks, element-as-value props).

#### Scenario: pink composes without tags wrappers

- **WHEN** a pink component renders plain HTML structure
- **THEN** that structure is authored as template markup, not as wrapper-component calls

#### Scenario: value positions use the functional form deliberately

- **WHEN** composition must travel as a JS value — an effect callback's return, a `.map` item, an `is=` prop
- **THEN** the functional form (or `el(tagName)` for plain tags) is used, and this is the sanctioned escape hatch rather than a violation

### Requirement: The tags wrapper layer is retired

First-party code SHALL NOT depend on `@loom-js/tags`; the package is removed from the repository once zero first-party imports remain, and its published versions are marked deprecated on npm.

#### Scenario: no first-party tags imports remain

- **WHEN** the conversion completes
- **THEN** no file in `packages/` or `apps/loom/` imports from `@loom-js/tags`, and pink's peerDependencies no longer list it

#### Scenario: converted components render identically

- **WHEN** a component is converted from tags composition to element syntax
- **THEN** its rendered DOM is byte-equal to the pre-conversion output (modulo retained `slot` attributes), proven per component
