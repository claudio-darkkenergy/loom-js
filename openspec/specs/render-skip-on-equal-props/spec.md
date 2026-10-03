# render-skip-on-equal-props Specification

## Purpose

Defines when a live component instance re-renders in `@loom-js/core`: a re-invocation with shallow-equal props (`children` by reference, `ref` excluded) returns the existing context without running the template or firing render life-cycles, while the first render, a remount, a fingerprint change, a changed prop or the instance's own activities still render. The Components topic documents the rule for consumers.

## Requirements

### Requirement: A live component with unchanged props does not re-run its template

When a component context function is invoked on a live context (rendered root, same template fingerprint) with input props whose own keys match the previous render's and whose values are each `Object.is`-equal — `children` compared by reference, `ref` excluded — it SHALL return the existing context without calling the template function or firing `rendered` life-cycle handlers.

#### Scenario: Partial update renders only the changed rows

- **WHEN** 1 000 keyed rows re-reconcile and 100 of them receive a changed `label` prop
- **THEN** exactly 100 row templates run and the other 900 rows' `onRendered` handlers do not fire

#### Scenario: Same props, new children array

- **WHEN** a component is re-invoked with equal scalar props but a different `children` array reference
- **THEN** it re-renders

### Requirement: Renders are still forced where state can change

The skip SHALL NOT apply on the first render, after a remount, when the template fingerprint differs, or when any prop value differs; an activity the instance subscribes to SHALL keep driving its own effects independently of the parent.

#### Scenario: Own activity still updates a skipped instance

- **WHEN** a parent re-renders with equal props for a child whose template contains `count.effect(...)`, and then `count.update()` fires
- **THEN** the child's effect re-runs and its DOM reflects the new value

#### Scenario: Changed prop re-renders

- **WHEN** one prop value changes between invocations
- **THEN** the template runs and `onRendered` fires

### Requirement: The re-render rule is documented

The Components topic SHALL state when an instance re-renders (a prop change or an activity it subscribes to) and that a parent's re-render alone does not re-run a child with unchanged props, pointing render-time reads of changing values at `activity`.

#### Scenario: Topic states the rule

- **WHEN** a reader opens the Components topic's rendering section
- **THEN** it names both triggers and the parent-re-render exception in plain sentences
