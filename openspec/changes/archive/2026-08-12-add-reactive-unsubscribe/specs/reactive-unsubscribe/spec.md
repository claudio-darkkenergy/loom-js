## ADDED Requirements

### Requirement: Reactive effects are disposable

`reactiveEffect` SHALL return a dispose function. After dispose is invoked, subsequent triggers of any property the effect was tracked against SHALL NOT re-run the effect, and the effect SHALL be removed from every dependency set it occupied.

#### Scenario: Disposed effect stops re-running

- **WHEN** a consumer registers an effect via `reactiveEffect`, invokes the returned dispose function, and then updates a tracked property
- **THEN** the effect does not run again

#### Scenario: Dispose is idempotent

- **WHEN** the returned dispose function is invoked more than once
- **THEN** the second and later invocations are no-ops and do not throw

#### Scenario: Disposed effect cannot resurrect

- **WHEN** an effect is disposed while it is being triggered (already captured for the current pass)
- **THEN** the effect does not run for that pass or any later pass, and it is not re-tracked into any dependency set

### Requirement: Activity watchers return unsubscribers

`activity(...).watch(action)` SHALL return an unsubscriber function. After the unsubscriber is invoked, subsequent `update` calls on the activity SHALL NOT invoke the watcher, while other watchers and effects on the same activity remain active.

#### Scenario: Unsubscribed watcher stops receiving updates

- **WHEN** a consumer calls `watch(action)`, invokes the returned unsubscriber, and then calls `update` with a changed value
- **THEN** `action` is not invoked for that update

#### Scenario: Unsubscribing one watcher leaves others intact

- **WHEN** two watchers are registered on the same activity and one is unsubscribed during or between trigger passes
- **THEN** the remaining watcher continues to receive every subsequent update exactly once

### Requirement: Route watchers honor the unsubscriber contract

`watchRoute(action)` SHALL return the unsubscriber for its underlying route-activity watcher, as its documentation states. After invocation, route updates SHALL NOT invoke the handler.

#### Scenario: Unsubscribed route watcher stops firing

- **WHEN** a consumer calls `watchRoute(handler)`, invokes the returned unsubscriber, and a route change occurs
- **THEN** `handler` is not invoked for that route change
