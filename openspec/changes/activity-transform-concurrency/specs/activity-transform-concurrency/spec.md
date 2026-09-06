## ADDED Requirements

### Requirement: The latest dispatch wins by default

For an activity with an asynchronous transform, a newer `update()` SHALL supersede in-flight dispatches: commits from a superseded run SHALL be dropped, commits from the current run SHALL apply (multi-commit within the run included), and the activity's settled value SHALL reflect the latest dispatch regardless of resolution order. Superseded runs SHALL remain settlement-tracked.

#### Scenario: out-of-order resolution cannot commit stale data

- **WHEN** dispatch A is in flight, dispatch B is issued, and A's transform commits after B's has committed
- **THEN** A's commit is dropped and the value remains B's

#### Scenario: multi-commit transforms work within the current run

- **WHEN** the current run commits a loading state and then a data state
- **THEN** both commits apply in order

#### Scenario: settlement waits for superseded work

- **WHEN** a superseded run's promise is still pending
- **THEN** `settled()` does not resolve until it settles, even though its commits are dropped

### Requirement: Sequenced mode queues dispatches in order

With the sequenced option enabled, dispatches SHALL apply strictly in dispatch order: a dispatch's transform SHALL NOT be invoked until the prior dispatch's run settles (rejection included), each run's `value` context SHALL reflect its predecessor's committed result, and no commit SHALL be dropped.

#### Scenario: commits land in dispatch order despite resolution speed

- **WHEN** two sequenced dispatches are issued and the second's async work would resolve faster
- **THEN** the second transform starts only after the first settles, and the final value reflects both, in order

#### Scenario: a rejection releases the queue

- **WHEN** a sequenced run's transform rejects
- **THEN** the next queued dispatch runs

### Requirement: Untransformed and synchronous paths are unchanged

Activities without a transform, and transforms that commit synchronously, SHALL behave exactly as before — last call wins by call order, with no new bookkeeping observable.

#### Scenario: sync semantics preserved

- **WHEN** an activity without a transform receives two `update()` calls
- **THEN** the value is the second call's input, as today
