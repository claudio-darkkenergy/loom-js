# Spec Delta

## Purpose

Gives every activity a readable name in devtools and diagnostics. The name is set explicitly through the `label` option, injected by the build tool from the declaring binding, or derived from the owning instance.

## ADDED Requirements

### Requirement: The build tool labels activities from their bindings

When name injection is active, the build tool SHALL label every activity created as `const|let <ident> = activity(…)` or `const|let <ident> = own(() => activity(…))` with `<ident>`. This SHALL apply at any nesting depth, with an optional type annotation or generic arguments, and without the author writing a label.

#### Scenario: Top-level activity

- **WHEN** a module declares `export const count = activity(0)` and the app is built in development
- **THEN** devtools and diagnostics name it `count`

#### Scenario: Activity inside a component body

- **WHEN** a component's template function declares `const open = own(() => activity(false))`
- **THEN** each instance's activity is named `open`

#### Scenario: Unbound activity is not labeled

- **WHEN** an activity is created inline as an argument (`effect(activity(0))`) with no binding
- **THEN** no label is injected

### Requirement: An explicit label wins over an injected one

When an activity has both an explicit `label` and an injected one, the explicit label SHALL be used.

#### Scenario: Explicit overrides injection

- **WHEN** `const count = activity(0, { label: 'cartCount' })` is built with injection active
- **THEN** devtools and diagnostics name it `cartCount`

### Requirement: Unlabeled owned activities are named after their owner

An activity with no explicit or injected label SHALL be shown in devtools as its owning instance's name followed by its stable generated tag. An activity with neither a label nor an owner SHALL keep its stable generated tag alone.

#### Scenario: Owned without a label

- **WHEN** a `Counter` instance owns an activity that has no label
- **THEN** devtools names it `Counter › activity#N`, with N its stable tag

#### Scenario: No label and no owner

- **WHEN** an unlabeled activity is created at module top level outside any build injection
- **THEN** devtools names it `activity#N`

### Requirement: Core labels the activities it creates

Core SHALL give every activity it creates itself an explicit label: the router's location, route and page activities as `router.location`, `router.route` and `router.page`, and each lazy import's activity as `lazyImport(<key>)`.

#### Scenario: Router activities

- **WHEN** a component renders `locationEffect(…)` and `routeEffect(…)`
- **THEN** devtools and diagnostics name their activities `router.location` and `router.route`

#### Scenario: Lazy import

- **WHEN** an app calls `lazyImport('./pages/home', importer)`
- **THEN** the returned activity is named `lazyImport(./pages/home)`
