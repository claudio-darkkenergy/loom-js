# activity-reset-semantics Specification

## Purpose

Defines what an activity's `reset()` does: it restores the frozen initial value without invoking the transform, under the same change comparison and subscriber notification as any commit, and on a transformed activity it dispatches as a run so it relates to in-flight transform runs according to the activity's concurrency mode.

## Requirements

### Requirement: Reset restores the initial value without invoking the transform

`reset()` SHALL commit the activity's frozen initial value through the normal change comparison and subscriber notification, and SHALL NOT invoke the activity's transform. The initial value SHALL take the untransformed path at creation and on reset alike.

#### Scenario: reset on a transformed activity bypasses the transform

- **WHEN** a transformed activity holding a committed value is `reset()`
- **THEN** the stored value returns to the initial value, subscribers are notified, and the transform is never called

#### Scenario: reset at baseline is a comparison no-op

- **WHEN** `reset()` is called while the current value already equals the initial value (under the activity's comparison mode)
- **THEN** no subscriber notification fires

#### Scenario: reset on an untransformed activity commits directly

- **WHEN** an untransformed activity holding a committed value is `reset()`
- **THEN** the stored value returns to the initial value synchronously

### Requirement: Reset on a transformed activity dispatches as a run

On a transformed activity, `reset()` SHALL dispatch through the activity's concurrency mode like any other run, so an in-flight transform run and a reset relate to each other exactly as two dispatches would. With no run in flight the reset SHALL commit synchronously and add no pending settlement work.

#### Scenario: idle reset is synchronous and untracked

- **WHEN** `reset()` is called on an activity with an async transform and no run in flight
- **THEN** the initial value is stored before `reset()` returns, and the pending settlement count is unchanged

#### Scenario: reset retires an in-flight run under `'latest'`

- **WHEN** `reset()` is called while a transform run is in flight under the default concurrency
- **THEN** the initial value is stored immediately, the in-flight run's signal aborts, and its later commits are dropped

#### Scenario: reset keeps dispatch order under `'ordered'`

- **WHEN** `reset()` is called while an earlier run is in flight under `concurrency: 'ordered'`
- **THEN** the initial value is committed only after the earlier run has settled and flushed

#### Scenario: reset waits its turn under `'serial'`

- **WHEN** `reset()` is called while a run is in flight under `concurrency: 'serial'`
- **THEN** the reset is queued, counts as pending settlement work while queued, and commits the initial value once the prior run settles
