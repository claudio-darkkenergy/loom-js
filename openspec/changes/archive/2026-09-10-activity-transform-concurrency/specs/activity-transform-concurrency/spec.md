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

### Requirement: Supersession aborts the retired run's signal

The transform context SHALL carry an `AbortSignal`; under the default mode, superseding a dispatch SHALL abort the superseded run's signal, so cooperative work (e.g. `fetch(url, { signal })`) cancels and the run settles promptly. A transform that ignores the signal SHALL remain correct — its late commits are dropped as usual. The signal SHALL NOT fire in the ordered modes, where no dispatch is superseded.

#### Scenario: a wired fetch cancels and settlement drains

- **WHEN** a superseded run passed its `signal` to its async work and that work aborts
- **THEN** the run settles immediately and `settled()` no longer waits on it

#### Scenario: ignoring the signal stays safe

- **WHEN** a superseded run ignores its `signal` and later commits
- **THEN** the commit is dropped and the value reflects the latest dispatch

### Requirement: Ordered mode runs in parallel and commits in dispatch order

With `concurrency: 'ordered'`, every dispatch's transform SHALL start immediately, and commits SHALL apply strictly in dispatch order: a run's commits are held until all earlier dispatches have settled and flushed, then apply in order; no commit SHALL be dropped, and a rejection SHALL release the turn to the next dispatch.

#### Scenario: parallel speed, ordered arrival

- **WHEN** three ordered dispatches run concurrently and the third resolves first
- **THEN** all three transforms ran without waiting on each other, and the commits apply in dispatch order 1, 2, 3

#### Scenario: a rejected run releases the turn

- **WHEN** an ordered run rejects while later runs hold buffered commits
- **THEN** the later runs' commits flush in order

### Requirement: Serial mode queues execution itself

With `concurrency: 'serial'`, a dispatch's transform SHALL NOT be invoked until the prior dispatch's run settles (rejection included), each run's `value` context SHALL reflect its predecessor's committed result, and no commit SHALL be dropped.

#### Scenario: execution waits its turn

- **WHEN** two serial dispatches are issued and the second's async work would resolve faster
- **THEN** the second transform starts only after the first settles, and the final value reflects both, in order

#### Scenario: each run sees its predecessor's value

- **WHEN** serial transforms read `value` to accumulate
- **THEN** every run observes the committed result of the run before it

### Requirement: Untransformed and synchronous paths are unchanged

Activities without a transform, and transforms that commit synchronously, SHALL behave exactly as before — last call wins by call order, with no new bookkeeping observable.

#### Scenario: sync semantics preserved

- **WHEN** an activity without a transform receives two `update()` calls
- **THEN** the value is the second call's input, as today

### Requirement: A timeout retires a run by clock

With `timeout` set, a run exceeding it SHALL be retired exactly as supersession retires a run — signal aborted, subsequent commits dropped, any serial queue or ordered turn released — and SHALL count as settled for the settlement signal even if its promise never resolves. Expiry SHALL surface on the always-on console lane. Without `timeout`, runs are unbounded, as today.

#### Scenario: a hung serial run stops blocking the queue

- **WHEN** a `'serial'` dispatch's transform hangs past the activity's `timeout`
- **THEN** the next queued dispatch runs, the hung run's later commits (if any) are dropped, and `settled()` does not wait on it

#### Scenario: expiry aborts cooperative work

- **WHEN** a run wired its `signal` into its async work and the timeout expires
- **THEN** the signal aborts and the work cancels

#### Scenario: no timeout means no bound

- **WHEN** an activity sets no `timeout`
- **THEN** long-running transforms behave exactly as before

#### Scenario: the missing bound is pointed at, not invented

- **WHEN** debug narration (activity scope) is enabled and a run on a timeout-less activity stays pending past the notice threshold
- **THEN** a debug-lane message flags the long-pending run, and no timeout is applied

### Requirement: The transform input is a read-only contract, not a runtime mutation

The transform context SHALL expose `input` typed `Readonly<I>`, handed through by reference with no runtime copying or freezing — the caller's object is never altered by core.

#### Scenario: mutating transforms fail to compile

- **WHEN** a transform assigns to a property of `input`
- **THEN** type-checking rejects it

#### Scenario: the caller's object is untouched

- **WHEN** a caller dispatches an object and continues using it after `update()`
- **THEN** the object is neither frozen nor copied — the caller's later writes behave exactly as before
