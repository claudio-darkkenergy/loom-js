## MODIFIED Requirements

### Requirement: The async render's settlement wait is bounded

`renderToString` SHALL bound its settlement wait with a `maxWait` option (milliseconds, default `4000`, `Infinity` to disable), symmetric with `hydrate`'s bound: framework-tracked async work that outlives the bound does not hang the render.

#### Scenario: Slow tracked work serializes fully within the bound

- **WHEN** an activity transform awaits async work that takes multiple macrotask hops to resolve (e.g. real I/O), and it settles within `maxWait`
- **THEN** `renderToString` serializes the transform's landed content — not the fallback that was in the markup while the work was pending

#### Scenario: Expiry serializes what has landed, with a warning

- **WHEN** tracked async work is still pending when `maxWait` elapses
- **THEN** `renderToString` resolves with the markup that has landed so far
- **AND** warns via the framework console unconditionally — not debug-gated, per the diagnostic-logging capability — naming the elapsed bound and the pending operation count

#### Scenario: The bound can be disabled

- **WHEN** `maxWait: Infinity` is passed
- **THEN** the render waits for settlement indefinitely
