# template-slot-updates Specification

## Purpose

Defines how a rendered component instance in `@loom-js/core` applies interpolation changes: one updater per dynamic path built at first render, and a re-render that compares each new value with the previous one by the slot change predicate and calls only the changed slots' updaters — no reactive subscription or effect per slot.

## Requirements

### Requirement: Each dynamic path has one updater

Rendering a component instance SHALL hold exactly one slot per dynamic path of its template and apply the path's interpolated value to it through the update function for the slot's kind, shared across instances. Building and applying a slot SHALL create no reactive subscription, effect or dependency record, and no per-instance function. A text slot SHALL write a primitive value into the text node it owns; a node, node list or context-function value SHALL replace that node, and a user-supplied node SHALL never be written to.

#### Scenario: First render applies every slot once

- **WHEN** a component with N dynamic paths renders for the first time
- **THEN** each path's value is applied to its node exactly once

#### Scenario: No reactive state per slot

- **WHEN** an instance renders
- **THEN** the number of reactive effects alive does not grow with the number of its dynamic paths

#### Scenario: No closure per slot

- **WHEN** an instance renders
- **THEN** the functions reachable from its context do not grow with the number of its dynamic paths

#### Scenario: Primitive text updates write in place

- **WHEN** a text slot re-renders from one string to another
- **THEN** the same text node is updated (a `characterData` mutation, no `childList` mutation)

#### Scenario: A node value still replaces the text node

- **WHEN** a text slot re-renders from a string to an element and then back to a string
- **THEN** the element replaces the text node, and the later string is written into a fresh text node — not into the element

### Requirement: Re-renders apply only the slots whose values changed

On a re-render the instance SHALL compare each new interpolation with the previous one using the slot change predicate — DOM nodes by identity, context functions always changed, plain objects by deep difference, everything else by strict equality — and SHALL call the updater only for the slots that changed, storing the new value.

#### Scenario: Unchanged slots are not re-applied

- **WHEN** an instance re-renders with the same primitive values in some slots and new values in others
- **THEN** only the changed slots' nodes are written

#### Scenario: Context-function slots always re-apply

- **WHEN** an instance re-renders a slot whose value is a component or activity context function
- **THEN** that slot's updater runs, so the child reconciles with its persistent context

#### Scenario: Same DOM node is not re-inserted

- **WHEN** a re-render hands a slot the same `Node` instance it already holds
- **THEN** the slot is left untouched
