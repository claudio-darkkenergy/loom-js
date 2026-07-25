## Purpose

Defines how `@loom-js/core` array-valued `activity()` instances detect content-level changes, isolate their internal value from external mutation, and reconcile array items in the DOM — including key-based node reuse and safe context snapshotting for reactive array items.

## Requirements

### Requirement: Array activities detect content-level change

An `activity()` whose value is an array SHALL determine whether to re-run subscribed effects by comparing array **contents**, not object identity. When `deep: true` is configured, a same-length array whose elements are all strictly equal (in order) to the current value SHALL be treated as unchanged and SHALL NOT re-run subscribed effects.

#### Scenario: Same-content array update does not re-render

- **WHEN** an array activity with `{ deep: true }` receives an `update()` whose new array has the same elements in the same order as the current value
- **THEN** `shouldUpdate` returns `false`
- **AND** no subscribed `activity.effect(...)` re-runs

#### Scenario: Changed-content array update re-renders

- **WHEN** an array activity with `{ deep: true }` receives an `update()` whose new array differs from the current value in length, order, or any element
- **THEN** `shouldUpdate` returns `true`
- **AND** each subscribed `activity.effect(...)` re-runs

#### Scenario: Force overrides content comparison

- **WHEN** an array activity is updated with `force` enabled (via the `force` option or `update(value, true)`)
- **THEN** subscribed effects re-run even if the array contents are unchanged

### Requirement: Array activity values are reference-isolated

An array activity SHALL NOT expose its internal current value by shared reference. `resolveCurrentValue` and the public `value()` getter SHALL return a copy of an array value, so that a consumer mutating the returned array cannot silently defeat future change detection.

#### Scenario: Mutating a returned array does not corrupt internal state

- **WHEN** a consumer reads an array activity's value and mutates the returned array in place
- **THEN** the activity's internal current value is unaffected
- **AND** a subsequent `update()` with the original contents is still detected correctly

### Requirement: Array reconciliation preserves falsy keys

When reconciling an array of context functions, the templating layer SHALL use a provided context key when one exists — including the falsy keys `0` and `''` — and SHALL fall back to the positional index only when no key is provided.

#### Scenario: Zero key is not collapsed to index

- **WHEN** an array item's resolved context supplies `key` equal to `0`
- **THEN** reconciliation uses `0` as the child-context key
- **AND** does not substitute the array index

### Requirement: Reordered keyed items reuse their own DOM node

When an array of context-function items each supplies a stable, **string** `key`, reconciling a reordered array SHALL reuse each item's existing DOM node (moving it to the new position) rather than repainting the node that happens to occupy the target index. Items without a `key` SHALL retain the existing index-positional behavior.

Numeric keys are a **known limitation** and are out of scope of this requirement: a numeric user key can collide with the index-based fallback keyspace during the outer interpolation's re-reconciliation, so per-item reuse is not guaranteed for numeric keys until the double-reconciliation is resolved (tracked as a follow-up).

#### Scenario: Keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a stable string `key` and an `update()` reorders the array
- **THEN** the DOM element associated with a given key is the same element instance before and after the update
- **AND** it is moved to the position matching its new index

#### Scenario: Unkeyed items fall back to index reconciliation

- **WHEN** mapped array items supply no `key`
- **THEN** reconciliation reuses the DOM node at each index and updates it in place (existing behavior, no per-item move)

### Requirement: Context snapshotting must not execute non-snapshotable values

The helper that extracts a context snapshot for an array item SHALL only invoke values that implement the dry-run snapshot protocol — component context functions (named `contextFunction`). It SHALL NOT invoke an `activityContextFunction`, because that function has no dry-run mode and executing it would set up a reactive subscription on a throwaway context (a leak and a spurious render). Such values SHALL yield an empty snapshot and fall back to index-based reconciliation.

#### Scenario: Component context function is snapshotted for its key

- **WHEN** an array item is a component context function (name `contextFunction`) created with a `key` prop
- **THEN** the context-for-value helper returns its snapshot with that `key`

#### Scenario: Activity context function is not executed by snapshotting

- **WHEN** an array item is an `activityContextFunction` (the result of `activity.effect(...)`)
- **THEN** the context-for-value helper returns an empty snapshot without invoking it
- **AND** no reactive subscription or render is triggered as a side effect
