## ADDED Requirements

### Requirement: Each dynamic path has one updater

Rendering a component instance SHALL build exactly one updater per dynamic path of its template and call it with the path's interpolated value. Building and calling an updater SHALL create no reactive subscription, effect or dependency record.

#### Scenario: First render applies every slot once

- **WHEN** a component with N dynamic paths renders for the first time
- **THEN** each path's value is applied to its node exactly once

#### Scenario: No reactive state per slot

- **WHEN** an instance renders
- **THEN** the number of reactive effects alive does not grow with the number of its dynamic paths

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
