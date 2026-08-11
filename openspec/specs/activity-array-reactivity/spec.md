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

When an array of context-function items each supplies a stable `key` — of **either** `string` or `number` type — reconciling a reordered array SHALL reuse each item's existing DOM node (moving it to the new position) rather than repainting the node that happens to occupy the target index. Items without a `key` SHALL retain the existing index-positional behavior.

The former numeric-key limitation is resolved: a pass over already-resolved DOM nodes no longer deletes the child context of a keyed item whose key collides with the index keyspace.

#### Scenario: Keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a stable `key` (string or numeric) and an `update()` reorders the array
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

### Requirement: Effect-owned array subtree is reconciled once per update

An array produced by an `activity.effect(...)` SHALL be reconciled exactly once per update by the effect that owns it. The outer `${...}` interpolation SHALL NOT re-reconcile the effect's already-resolved DOM elements into the effect's child-context map. In particular, a reconciliation pass over resolved DOM elements SHALL NOT delete a child context that was created for a keyed context-function item.

#### Scenario: No destructive re-reconciliation of resolved elements

- **WHEN** an `activity.effect(...)` renders an array of keyed items and the surrounding component update triggers the outer interpolation
- **THEN** the effect's `children` map still contains a child context for every live key
- **AND** no child context created for a keyed item is deleted by a pass over resolved DOM elements

#### Scenario: Single reconciliation per update

- **WHEN** an array-valued `activity.effect(...)` re-runs due to an `update()`
- **THEN** each array item's context function is resolved once for that update
- **AND** the array is not reconciled a second time against its own resolved output

### Requirement: Numeric keys reuse their DOM node across a reorder

Per-item DOM node reuse across a reorder SHALL hold for **numeric** keys as well as string keys. A numeric `key` whose value equals an array index SHALL NOT lose its child context, and reordering a numeric-keyed list SHALL reuse each item's existing DOM node.

#### Scenario: Numeric-keyed item keeps its node identity across a reorder

- **WHEN** an array activity renders items each passing a numeric `key` (e.g. `1, 2, 3`) and an `update()` reorders the array (e.g. to `3, 2, 1`)
- **THEN** the DOM element associated with a given numeric key is the same element instance before and after the update
- **AND** it is moved to the position matching its new index

#### Scenario: Numeric key equal to an index is not collapsed or deleted

- **WHEN** a keyed item uses a numeric key equal to an array index (e.g. key `1` at some position)
- **THEN** its child context is preserved across re-reconciliation
- **AND** the item is not recreated on the next reorder

### Requirement: Array-valued slots reuse a persistent parent context

`appendChildContext` SHALL return a persistent child context for an **array** value, stored in the parent's `children` map under a keyspace that cannot collide with a component context at the same slot key. Re-reconciling an array slot SHALL receive the same context object — and therefore the same `children` map of per-item contexts — on every update, so item components reuse their live context and DOM nodes instead of being re-instantiated from a manufactured empty context. When a slot's value changes kind (component context function ⇄ array ⇄ primitive), the stale other-kind context for that slot SHALL be dropped.

#### Scenario: Re-rendering an array slot preserves item DOM identity

- **WHEN** an `activity.effect(...)` wraps a component whose template interpolates an array of component context functions, and the activity's `update()` fires repeatedly
- **THEN** each array item's element is the same DOM node instance across updates
- **AND** exactly one copy of the component's subtree exists in the document after every update

#### Scenario: Flattened children arrays reuse item contexts by index

- **WHEN** a component's `children` prop is an array containing a nested array (flattened one level at the component boundary, per existing behavior) and the slot re-reconciles
- **THEN** each flattened item reuses its child context — by snapshot `key` when provided, by index otherwise
- **AND** each item's DOM node is preserved across updates

#### Scenario: Kind change drops the stale slot context

- **WHEN** a slot that previously held an array is updated with a non-array value (or vice versa)
- **THEN** the stale context for the previous kind is removed from the parent's `children` map
- **AND** the new value is reconciled against a context appropriate to its kind

### Requirement: Re-running an effect on a live context does not duplicate subscribers

Invoking an `activityContextFunction` with a context that is already live — one that has a rendered `root` and a registered action scope — SHALL NOT register an additional reactive effect for the activity. It SHALL update the action scope and re-render directly, so a single `update()` produces exactly one render pass per live effect. In particular, `activity.effect` items inside a re-reconciled array slot SHALL keep their single subscription because their persistent child context is passed back to them on every pass.

#### Scenario: Repeated toggles keep a single subscription

- **WHEN** an `activity.effect(...)` renders a subtree containing nested `activity.effect(...)` children in an array slot, and the outer activity's `update()` fires N times
- **THEN** each nested effect's action runs at most once per relevant `update()`
- **AND** no additional render passes accumulate as N grows

#### Scenario: No duplicated subtree after repeated updates

- **WHEN** the same effect-wrapped component is toggled (updated) many times in sequence
- **THEN** the document contains exactly one instance of the component's root element
- **AND** no detached or stale sibling copies are inserted by later updates
