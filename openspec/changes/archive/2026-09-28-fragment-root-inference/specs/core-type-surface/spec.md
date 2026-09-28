## ADDED Requirements

### Requirement: Component callables are valid in the tag position

`TemplateTagValue` SHALL admit any component callable — `Component<Props>`, `SimpleComponent<Props>`, or a plain function returning a `ContextFunction` — whether `Props` has required members, only optional members, or none, so that `<${X} …/>` type-checks for every component the framework can render. Functions that do not return a `ContextFunction` SHALL remain rejected.

#### Scenario: required-props component type-checks as a tag

- **WHEN** `const Card = component<{ heading: string }>(...)` is interpolated as `` html`<${Card} heading="Docs" />` ``
- **THEN** the template type-checks without error or cast

#### Scenario: plain function returning a ContextFunction type-checks as a tag

- **WHEN** `const Super = ({ label }: { label: string }) => Button({ label })` is interpolated as `` html`<${Super} label="Save" />` ``
- **THEN** the template type-checks without error

#### Scenario: arbitrary functions stay rejected

- **WHEN** a function returning `number` is interpolated in the tag position
- **THEN** TypeScript reports a compile-time error

### Requirement: `$attrs` entries accept attribute bindings

`AttrsTemplateTagValue` SHALL admit an `AttrBinding` (the value of `activity.bind()`) as an entry value, matching the runtime behavior the `reactive-attr-bindings` capability specifies.

#### Scenario: bound entry type-checks

- **WHEN** a template writes `$attrs=${{ 'aria-busy': isBusy.bind((busy) => String(busy)) }}`
- **THEN** the template type-checks without error or cast
