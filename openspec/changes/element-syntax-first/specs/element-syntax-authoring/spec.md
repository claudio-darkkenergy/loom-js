<!-- DRAFT — high-level requirements for an exploratory stub; refine before apply. -->

## ADDED Requirements

### Requirement: Element syntax is the primary authoring surface

Project documentation, first-party UI code (pink, apps), and examples SHALL author composition in element syntax, presenting the functional form as the underlying architecture and escape hatch rather than a parallel authoring style.

#### Scenario: first-party code authors in markup

- **WHEN** a pink or app component composes elements and components
- **THEN** it uses element syntax (markup, attributes, children, named slots) rather than tags wrappers or functional composition, except where a value-position site genuinely requires the functional form

### Requirement: Core provides the surviving element-level components

Kit-agnostic element components with real behavior SHALL live in `@loom-js/core`, tree-shakeable: a `RouteLink` that wires SPA routing itself, and the media utilities (`Svg`, `Picture`, `ResponsiveImage`, `Source`).

#### Scenario: RouteLink routes without caller wiring

- **WHEN** a template composes `<${RouteLink} href="/docs">…</>`
- **THEN** activating the link performs SPA routing via the core router with no caller-supplied `route` handler

### Requirement: The tags wrapper layer retires

`@loom-js/pink` and first-party apps SHALL NOT depend on `@loom-js/tags`; once no first-party imports remain, the package is removed.

#### Scenario: pink composes without tags

- **WHEN** any pink component renders plain HTML structure
- **THEN** it authors that structure as template markup, not as tags wrapper calls

### Requirement: Convention enforcement is installable, not imposed

Lint rules enforcing the authoring convention SHALL ship as a separate installable package (eslint; GritQL patterns for Biome, lint-only); the repository itself remains prettier-only.

#### Scenario: a consuming team opts in

- **WHEN** a project installs the lint package and enables its rules
- **THEN** functional composition in template-eligible positions and tags-style wrapper usage are reported as lint findings
