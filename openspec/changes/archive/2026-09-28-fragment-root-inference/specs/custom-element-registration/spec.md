## MODIFIED Requirements

### Requirement: Fragment roots keep working

A component whose template has multiple top-level nodes (a fragment-rooted template, as classified by the parser) SHALL remain instantiable as a custom element. This works today (`mount` spreads a `TemplateRootArray`); the requirement exists to lock it in against regression.

#### Scenario: fragment-root component is instantiated

- **WHEN** a registered component renders a template with multiple top-level nodes
- **THEN** all of its root nodes are mounted into the element or its shadow root, in order
- **AND** no error is thrown by the registration path or `mount`
