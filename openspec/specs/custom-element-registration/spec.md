## Purpose

Defines the project's obligations around exposing loom components as custom elements — that registration is something an author asks for rather than a side effect of defining a component, that fragment-rooted components stay instantiable, that shadow encapsulation is opt-in so light-DOM elements keep their app styling, that shadow-rooted content still has a supported path to app and theme styles, and that the registration path is covered by tests.

This capability targets **interop** — letting non-loom pages consume loom components — not authoring ergonomics. Composing components inside loom templates is a separate concern.

## Requirements

### Requirement: Custom element registration is explicit

Defining a component SHALL NOT define a global custom element as a side effect. Registration SHALL happen only when the author asks for it and supplies an element name.

#### Scenario: component defined without asking for registration

- **WHEN** a component is defined as `component((html, props) => …)` — the idiomatic form across this repo
- **THEN** no custom element is defined
- **AND** no name is inferred from `templateFunction.name`, so registration can no longer silently early-return on a name the author never supplied

#### Scenario: component explicitly registered

- **WHEN** an author explicitly registers a component with an element name
- **THEN** the element is defined under that name
- **AND** an invalid custom element name (no hyphen) or a duplicate registration surfaces an error rather than failing silently

#### Scenario: element name is derivable and documented

- **WHEN** a developer wants a component available as a custom element
- **THEN** the documented way to set its element name is available in `packages/core/README.md`
- **AND** the resulting element name is a valid custom element name (contains a hyphen)

### Requirement: Fragment roots keep working

A component whose template uses the `<>…</>` fragment syntax to produce multiple top-level nodes SHALL remain instantiable as a custom element. This works today (`mount` spreads a `TemplateRootArray`); the requirement exists to lock it in against regression.

#### Scenario: fragment-root component is instantiated

- **WHEN** a registered component renders a `<>…</>` template with multiple top-level nodes
- **THEN** all of its root nodes are mounted into the element or its shadow root, in order
- **AND** no error is thrown by the registration path or `mount`

### Requirement: Encapsulation is opt-in per element

A registered custom element SHALL render into the light DOM by default. A shadow root SHALL be created only when the author asks for one.

#### Scenario: registered element renders in the light DOM

- **WHEN** a component is registered without requesting a shadow root
- **THEN** its rendered content is an ordinary child of the host element in the document tree
- **AND** `host.shadowRoot` is `null`
- **AND** application and design-system stylesheets apply to it with no additional mechanism

#### Scenario: encapsulation is requested explicitly

- **WHEN** a component is registered with a shadow root requested
- **THEN** its content renders into that shadow root instead of the light DOM

### Requirement: Shadow-rooted content can be styled by the app

Content rendered into a custom element's shadow root SHALL have a supported mechanism for receiving application and theme styles. Where a shadow root is created, it SHALL be `mode: 'open'`.

#### Scenario: a registered pink-style component picks up app theming

- **WHEN** a component with app-level or design-system styling is rendered into a shadow root
- **THEN** a documented mechanism carries those styles across the shadow boundary
- **AND** the element is not left unstyled by default

#### Scenario: shadow root stays reachable

- **WHEN** a custom element **that was registered with a shadow root** is instantiated
- **THEN** `host.shadowRoot` is non-null, so tests, devtools, and external queries can reach the rendered content
- **AND** `'closed'` is not used, since it adds no style encapsulation and only makes the content unreachable

### Requirement: Custom element instantiation is covered by tests

The registration path SHALL be exercised by `packages/core/tests/unit/custom-element.spec.ts`.

#### Scenario: registration paths are tested

- **WHEN** `pnpm -F @loom-js/core test-ci` runs
- **THEN** tests cover explicit element definition, `$`-prefixed attribute to camelCase prop mapping, children pass-through, a `<>…</>` fragment root, the default light-DOM path, and the opt-in shadow-root path
