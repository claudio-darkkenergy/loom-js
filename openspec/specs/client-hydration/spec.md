# client-hydration Specification

## Purpose

Defines the hydrating client boot for pre-rendered loom pages: `hydrate` defers takeover of a root's server-rendered children to a single atomic swap gated on the app-settled signal, so lazy route content and async activity work land before anything visibly changes. Covers the public `settled()` quiescence signal (per-window, over framework-tracked async work), the optional caller-supplied `ready` gate, the bounded `maxWait` worst case, lifecycle timing at real DOM attachment, and the zero-cost guarantee for non-hydrating apps.

Established by the `add-client-hydration` change (2026-08-16). Adopt-in-place hydration (claiming server DOM node-by-node) and dehydrated state / request-cache priming remain future extensions.

## Requirements

### Requirement: Hydrating boot defers takeover to a single atomic swap

The framework SHALL provide a client boot entry, `hydrate`, that leaves the root's pre-rendered children untouched while the app renders and settles off-DOM, then replaces the root's children exactly once with the rendered app. `hydrate` SHALL mirror `init`'s contract (`app`, `root`, `globalConfig`, `onAppMounted`) except that no append mode is offered — the swap is always a full replace.

#### Scenario: Pre-rendered content stays visible until the swap

- **WHEN** `hydrate({ app, root })` is called on a root containing server-rendered markup and the app includes content behind an async importer
- **THEN** the root's children are not modified before the app has settled
- **AND** after the swap the root contains the fully rendered app — settled route content, not the shell/fallback

#### Scenario: The swap is a single replacement

- **WHEN** the app settles and the swap runs
- **THEN** the root's children are replaced in one `replaceChildren`-equivalent operation, with no intermediate fallback state ever attached to the root

#### Scenario: Empty root degrades gracefully

- **WHEN** `hydrate` is called on a root with no pre-rendered children
- **THEN** the boot completes through the same deferred-swap path with the rendered app as the root's children

### Requirement: The settled signal reports quiescence of framework-tracked async work

The framework SHALL export a settled signal that resolves when no framework-mediated async work is pending — every thenable returned by an activity transform (lazy imports, page-route imports, async data transforms) has settled — confirmed by one macrotask of continued quiet, so chained async (an import whose render starts another import) is awaited to quiescence. The signal SHALL be scoped per window through the DOM provider seam.

#### Scenario: Chained lazy work is awaited to quiescence

- **WHEN** the settled signal is awaited while a pending lazy import's resolution triggers a further lazy import
- **THEN** the signal resolves only after the full chain has settled and a subsequent macrotask passes with nothing pending

#### Scenario: Synchronous apps settle immediately

- **WHEN** the settled signal is awaited for an app that performed no async work
- **THEN** it resolves after at most one macrotask

#### Scenario: Rejected async work still settles

- **WHEN** a tracked transform thenable rejects
- **THEN** the pending count still decrements and the settled signal can resolve

### Requirement: Hydration waits on settlement plus an optional app-supplied gate

`hydrate` SHALL gate its swap on the settled signal, and additionally on an optional `ready` promise supplied by the caller, covering async work the framework cannot track.

#### Scenario: Caller-supplied readiness delays the swap

- **WHEN** `hydrate({ app, root, ready })` is called and the settled signal resolves before `ready`
- **THEN** the swap does not run until `ready` has also settled

### Requirement: A bounded worst case — the swap always happens

`hydrate` SHALL accept a `maxWait` duration (default 4000 ms) after which the swap runs with whatever has rendered, emitting a console warning that names the still-pending work; `maxWait: Infinity` SHALL disable the bound.

#### Scenario: A never-settling app still boots

- **WHEN** the app holds a transform thenable that never settles and `maxWait` elapses
- **THEN** the swap runs with the app's current rendered state
- **AND** a warning is emitted indicating settlement did not complete

### Requirement: Lifecycle timing matches real DOM attachment

`onCreated`/`onRendered` SHALL fire during the off-DOM render exactly as under `init`; `onMounted` SHALL fire when the swap attaches the tree to the observed root; `onAppMounted` SHALL run after the swap.

#### Scenario: Mount hooks fire at the swap

- **WHEN** a hydrated app's component registers `onMounted`
- **THEN** the hook fires after the swap attaches the component to the document, not during the off-DOM render

### Requirement: Non-hydrating apps pay nothing

The hydration entry SHALL be tree-shakeable to zero bytes for apps that boot with `init`, and settlement tracking SHALL add no allocation to synchronous activity updates.

#### Scenario: init-only bundle unchanged

- **WHEN** an app imports only `init` and builds with a tree-shaking bundler
- **THEN** the hydration entry contributes no bytes to the output bundle
