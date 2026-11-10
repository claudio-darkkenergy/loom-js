# Spec Delta

## MODIFIED Requirements

### Requirement: Activities driving the page are discoverable

Core SHALL report, for each live instance, the activities whose effect boundaries or attribute bindings it contains, and for each activity its display identity (label or stable generated tag), current value, pending state, and owning instance: the live instance holding it as an owned value, or none.

#### Scenario: Bound-only activity is found

- **WHEN** an activity is used only through `bind()` on an attribute
- **THEN** the activity is reported, attributed to the instance holding that attribute

#### Scenario: Owner is reported

- **WHEN** a component instance holds an activity through `own(() => activity(0))`
- **THEN** that activity's reported owner is the instance

#### Scenario: Module activity has no owner

- **WHEN** an activity is created at module top level
- **THEN** it is reported with no owning instance

### Requirement: Devtools is a runtime switch

`loom.devtools.enable()` SHALL load the registered devtools implementation and start it; `disable()` SHALL stop it and remove its hooks and page overlays. With no implementation registered, `enable()` SHALL warn once with the remedy and change nothing. `enable({ persist: true })` SHALL re-enable on the next load of the same tab before the app mounts. `open()` SHALL mark the tab so its next load starts devtools and reopens the HUD where it was; the mark SHALL clear when the implementation reports the HUD closed or devtools is disabled.

#### Scenario: Enable without registration

- **WHEN** `loom.devtools.enable()` runs in a build with no devtools registered
- **THEN** one warning names how to register devtools and nothing else happens

#### Scenario: Persisted enable survives reload

- **WHEN** devtools is enabled with `persist: true` and the tab reloads
- **THEN** devtools starts before the app mounts and records the initial render

#### Scenario: An open HUD reopens on reload

- **WHEN** the HUD was opened with `open()` and the tab reloads
- **THEN** devtools starts and the HUD reopens with no placement given, so it opens where it was; once the implementation reports the HUD closed, a reload doesn't reopen it

## ADDED Requirements

### Requirement: Component values resolve to their instances

Core SHALL let a devtools implementation resolve a component value — a prop such as `children`, a named slot region or an `el()` element — to the live instance it last rendered into, and SHALL resolve nothing for a value that never rendered or whose instance is gone.

#### Scenario: Element-syntax regions resolve

- **WHEN** a component receives element-syntax children, a named slot and an `el('ul')` value, and renders all three
- **THEN** each value resolves to its rendered instance: `children`, `slot:<name>` and `<ul>`

#### Scenario: Unrendered value resolves to nothing

- **WHEN** a component value is created but never rendered
- **THEN** it resolves to no instance
