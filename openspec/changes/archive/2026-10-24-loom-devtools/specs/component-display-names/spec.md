# Spec Delta

## Purpose

Gives every loom component a human-readable display name for devtools and diagnostics — set explicitly through `component()`'s options or injected by the build tool from the declaring binding.

## ADDED Requirements

### Requirement: component() accepts an optional display name

`component(templateFunction, { name })` SHALL accept an optional second options argument whose `name` becomes the component's display name. Omitting the argument SHALL leave rendering, typing and the returned `Component` unchanged. The name SHALL never affect rendering, reconciliation or identity.

#### Scenario: Explicit name is reported

- **WHEN** `const Card = component(fn, { name: 'Card' })` renders and devtools inspects its instance
- **THEN** the instance's name is `Card`

#### Scenario: Name does not affect behavior

- **WHEN** the same template function is defined once with and once without a `name`
- **THEN** both render identical DOM and reconcile identically

### Requirement: The build tool injects names from top-level bindings

When name injection is active, the build tool SHALL name every component declared at module top level as `const|let <Ident> = component(…)` or `defineElement(…)` (optionally exported, optionally with a type annotation or generic arguments) with `<Ident>`, without the author writing a name.

#### Scenario: Top-level declaration is named

- **WHEN** a module declares `export const ContentCard = component<ContentCardProps>((html, props) => …)` and the app is built in development
- **THEN** devtools reports its instances as `ContentCard`

#### Scenario: Nested declaration is not injected

- **WHEN** a component is declared inside a function body
- **THEN** no name is injected and the component is reported unnamed unless it passes an explicit `name`

#### Scenario: Library source passing through the build is named

- **WHEN** an app built with the build tool renders a `@loom-js/pink` component
- **THEN** that component is reported by its declaring binding name

### Requirement: An explicit name wins over an injected one

When a component has both an explicit `name` and an injected name, the explicit name SHALL be reported.

#### Scenario: Explicit overrides injection

- **WHEN** `export const Card = component(fn, { name: 'ProductCard' })` is built with injection active
- **THEN** devtools reports `ProductCard`

### Requirement: Custom-element components fall back to their tag

A component defined with `defineElement` SHALL be reported as `<Name> <tag>` when a name is known and as `<tag>` otherwise.

#### Scenario: Element without a name

- **WHEN** `defineElement('pink-button', fn)` is declared somewhere injection does not reach
- **THEN** devtools reports `<pink-button>`

#### Scenario: Element with an injected name

- **WHEN** `export const PinkButton = defineElement('pink-button', fn)` is built with injection active
- **THEN** devtools reports `PinkButton <pink-button>`

### Requirement: Unnamed components have a stable fallback

A component with no explicit, injected or tag name SHALL be reported as `Anonymous`, and `simple()` components SHALL not appear as tree nodes (their output appears under the nearest component).

#### Scenario: Anonymous component

- **WHEN** an unnamed `component()` instance is inspected
- **THEN** its name is `Anonymous`

### Requirement: Core's own components carry names

Components core creates SHALL be named without injection: `el()` tag components as `<tag>`, synthesized element-syntax children regions as `children` and named regions as `slot:<name>`, and core's element components (`RouteLink`, `Svg`, `Picture`) by their export names.

#### Scenario: Element helper

- **WHEN** an app renders `el('section')(…)` and devtools inspects that instance
- **THEN** its name is `<section>`
