## ADDED Requirements

### Requirement: Reset restores the initial value without invoking the transform

`reset()` SHALL synchronously commit the activity's frozen initial value through the normal change comparison and subscriber notification, and SHALL NOT invoke the activity's transform. The initial value SHALL take the untransformed path at creation and on reset alike.

#### Scenario: reset on a transformed activity bypasses the transform

- **WHEN** a transformed activity holding a committed value is `reset()`
- **THEN** the stored value returns to the initial value, subscribers are notified, and the transform is never called

#### Scenario: reset at baseline is a comparison no-op

- **WHEN** `reset()` is called while the current value already equals the initial value (under the activity's comparison mode)
- **THEN** no subscriber notification fires

#### Scenario: reset adds no settlement work

- **WHEN** `reset()` is called on an activity with an async transform
- **THEN** `settled()` observes no new pending work from the reset
