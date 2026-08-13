## Purpose

Defines loom's per-attribute reactivity contract: `activity.bind(select?)` produces an attribute binding that keeps a single DOM attribute in sync with an activity — the projected current value applies at render, every activity update re-runs only that attribute's application (no component re-render, no element replacement), bindings work as standard attr values and inside `$attrs` objects, and each attr slot holds at most one live subscription (re-render swaps dispose the previous one; unmount teardown releases the rest).

This capability covers `@loom-js/core`'s activity API and templating attr updaters, building on `reactive-unsubscribe` (disposal) and `unmount-teardown` (context teardowns). Bindings for `$on` handlers, `$props`, and component-tag props are out of scope.

## Requirements

### Requirement: Attribute bindings track their activity

An attribute whose template value is `activity.bind(select?)` SHALL render with the projected current value immediately and SHALL update to each new projected value when the activity updates — without re-rendering the component or replacing the element.

#### Scenario: Binding applies immediately and stays live

- **WHEN** a component renders an attribute bound via `bind` and the activity subsequently updates
- **THEN** the attribute holds the projected initial value at render
- **AND** reflects each new projected value after each update
- **AND** the element keeps its DOM node identity and the component body does not re-run

#### Scenario: Bindings work inside $attrs

- **WHEN** an `$attrs` object contains a bound entry
- **THEN** that attribute behaves as a live binding while sibling entries behave as today

### Requirement: Binding subscriptions never stack and are torn down

Each attr slot SHALL hold at most one live binding subscription: re-renders that replace a binding (with a new binding or a plain value) SHALL dispose the previous subscription, and unmounting the component SHALL dispose it via context teardown.

#### Scenario: Re-render swaps dispose the old subscription

- **WHEN** a component re-renders a bound attribute N times
- **THEN** a subsequent activity update changes the attribute exactly once

#### Scenario: Unmount releases the binding

- **WHEN** a component with a bound attribute is removed from the document and the activity later updates
- **THEN** no attribute update occurs and the subscription is released
