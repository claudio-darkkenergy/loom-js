## ADDED Requirements

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
