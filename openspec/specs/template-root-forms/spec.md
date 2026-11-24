# template-root-forms Specification

## Purpose

Defines how `@loom-js/core` decides a template's root form: the parser classifies each template from its parsed top-level nodes — exactly one element is single-rooted, anything else is fragment-rooted — with no authoring token involved, and compiled regions (synthesized children and named slots) are always fragments by an explicit compiler-set flag rather than by altering template statics.

## Requirements

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

### Requirement: A fragment root follows its live nodes

A fragment-rooted instance's node list SHALL match its live top-level nodes in DOM order after every change, not only at first render. When a top-level slot replaces, adds or removes nodes — through the instance's own re-render or through an activity effect that re-renders on its own — the instance's list SHALL reflect the change before the next read, and so SHALL the list of every fragment-rooted ancestor whose top level contains that slot. `node()`, life-cycle handlers, the check that decides whether an instance updates in place, and a keyed list moving the instance SHALL all use the current list.

#### Scenario: A top-level effect swaps its content

- **WHEN** a fragment-rooted component's top level is an activity effect, the effect re-renders to different nodes, and the component is then re-rendered with new props
- **THEN** the component updates in place, its effect's current content stays in the document, and `node()` returns the effect's current nodes

#### Scenario: A top-level list grows and shrinks

- **WHEN** a fragment-rooted component's top level is a list that re-renders from one item to three, then back to one
- **THEN** `node()` returns the three item nodes after the first change and the one item node after the second

#### Scenario: A nested fragment changes inside a fragment

- **WHEN** a fragment-rooted child sits at the top level of a fragment-rooted parent and the child's nodes change through its own effect
- **THEN** the parent's `node()` returns the child's current nodes in place of the old ones

#### Scenario: A keyed list moves a fragment-rooted item

- **WHEN** a keyed list reorders an item whose fragment root has gained nodes since first render
- **THEN** every current node of that item moves together and no stale node is reinserted

#### Scenario: Life-cycle handlers receive the current nodes

- **WHEN** a fragment-rooted instance whose top-level nodes have changed renders again
- **THEN** its `onRendered` handlers receive the current node list
