# devtools-introspection Specification

## Purpose

Defines what `@loom-js/core` exposes so a running app can be inspected: the mounted component tree, element-to-component lookup, the activities driving the page, the runtime devtools switch, and the `loom` console API — at near-zero cost while switched off.

## Requirements

### Requirement: Mounted apps are discoverable

Core SHALL keep track of every client app mounted by `init` or `hydrate`, so the full component tree of each is reachable at any time after mount without having been recorded in advance. An app removed from the document SHALL no longer be reported.

#### Scenario: Tree available on late enable

- **WHEN** devtools is enabled for the first time after the app has mounted and re-rendered
- **THEN** the reported tree matches the current DOM's component structure

### Requirement: The tree reports components and activity boundaries

The reported tree SHALL contain one node per live component instance and per activity effect boundary, in render order, each with its display name, key (when given), and child nodes. Unmounted instances SHALL not appear.

#### Scenario: Keyed list items

- **WHEN** a component renders a keyed list of three `Item` components
- **THEN** the tree shows three `Item` nodes, each carrying its key

#### Scenario: Unmounted branch disappears

- **WHEN** an activity update replaces a subtree
- **THEN** the next tree read no longer contains the replaced instances

### Requirement: Elements resolve to their owning component

Given any DOM node inside a mounted app, core SHALL resolve the innermost live component instance whose rendered output contains it. A node outside every app SHALL resolve to nothing.

#### Scenario: Nested element lookup

- **WHEN** `loom.inspect(el)` is called with a `<span>` rendered inside `Card` inside `List`
- **THEN** the result describes `Card`, with `List` as its parent

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

### Requirement: Inspection costs nothing measurable while off

With devtools not enabled, introspection support SHALL add no per-render allocation and no per-render work beyond constant-time checks, and the benchmark suite SHALL show no regression attributable to it.

#### Scenario: Bench parity

- **WHEN** `pnpm bench` runs before and after this change with devtools off
- **THEN** loom's results stay within run-to-run noise

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

### Requirement: The loom console API inspects while devtools runs

While devtools runs, the `loom` global SHALL provide `tree()`, `inspect(node)` and `activities()`, returning plain objects (names, keys, props as last rendered, parent, activities, root nodes) the native console can expand, and `inspect(node)` SHALL also select that instance in the inspector. Core SHALL build these records behind `@loom-js/core/devtools` and SHALL NOT install them itself, so its main entry ships none of them.

#### Scenario: Inspect the DevTools selection

- **WHEN** a developer selects an element in the browser's Elements panel and runs `loom.inspect($0)`
- **THEN** the console shows the owning component's name and current props

#### Scenario: Devtools off

- **WHEN** devtools has not been enabled, or has been disabled
- **THEN** the `loom` global has no `tree`, `inspect` or `activities`, and `loom.devtools` is still there to enable it

### Requirement: Component values resolve to their instances

Core SHALL let a devtools implementation resolve a component value — a prop such as `children`, a named slot region or an `el()` element — to the live instance it last rendered into, and SHALL resolve nothing for a value that never rendered or whose instance is gone.

#### Scenario: Element-syntax regions resolve

- **WHEN** a component receives element-syntax children, a named slot and an `el('ul')` value, and renders all three
- **THEN** each value resolves to its rendered instance: `children`, `slot:<name>` and `<ul>`

#### Scenario: Unrendered value resolves to nothing

- **WHEN** a component value is created but never rendered
- **THEN** it resolves to no instance
