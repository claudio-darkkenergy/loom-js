## Why

Loom's reactivity is subtree-grained: an `activity.effect` can drive content, but there is no way to bind a single DOM attribute to an activity — so consumers either accept a full subtree re-render to change one class (the old docs toggle boundaries) or drop to the imperative escape hatch (`watch` + `classList.toggle`, as `narrow-docs-effect-boundaries` did for the TOC, recording this primitive as its identified follow-up). The machinery to do better already exists: template attr slots are wired through per-render reactive updates (`setUpdatesForPaths` → `getAttrUpdate`), attr updaters receive the slot's child context, `watch` returns an `Unsubscriber`, and `ctx.teardowns` cleans subscriptions up on unmount.

## What Changes

- New activity method `bind(select?)` returning an `AttrBinding` — a marker object carrying the activity's `watch`/`value` and an optional `select` projection (e.g. `sideNavToggle.bind((isOpen) => classNames(styles.nav, { [styles._open]: isOpen }))`).
- Attr updaters (standard attrs and the `$attrs` special attr's entries) recognize an `AttrBinding` value: they apply the projected current value immediately, subscribe to the activity for subsequent updates (each firing re-runs just that attribute's updater), and register the unsubscriber on the slot context's `teardowns` so unmount teardown releases it automatically.
- Re-render safety: when a component re-render supplies a new binding (or a plain value) for a slot that previously held a binding, the previous subscription is disposed before the new one is applied — no stacking.
- Docs consumer migration: `DocsLayout`'s TOC watch is replaced by a declarative `topicTocToggle.bind(...)` on the container's class, retiring the app-level escape hatch this primitive was designed to eliminate (per-site verdict from `narrow-docs-effect-boundaries` design D1).
- Core README documents the new API.

Out of scope: bindings as component **props** (element-syntax component tags pass props, not DOM attrs — a binding reaching a component prop is not interpreted, matching today's behavior for other non-serializable values); event (`$on`) and `$props` bindings; and any change to `effect`/`watch` semantics.

## Capabilities

### New Capabilities

- `reactive-attr-bindings`: activities expose `bind(select?)` producing attribute bindings that keep a single DOM attribute in sync with the activity — applied immediately, updated per activity update without re-rendering the component, disposed on unmount via context teardowns, and swap-safe across re-renders.

### Modified Capabilities

- `docs-toggle-boundaries`: the TOC class binding becomes declarative via `bind`, replacing the mount-scoped imperative watch; observable behavior (class-only mutation, node identity, balanced subscriptions) is unchanged.

## Impact

- `packages/core/src/activity.ts` — `bind` method; `packages/core/src/types.ts` — `AttrBinding` type.
- `packages/core/src/lib/templating/get-attr-update.ts` — binding recognition in standard/`$attrs` updaters (the 445-line hot path; the file carries a 🟡 OCP audit entry whose dispatch-map fix is _not_ taken on here — additions follow the existing switch structure).
- `packages/core/tests/unit/` — new specs; `apps/loom/src/app/pages/docs/layout.ts` — TOC migration.
- `@loom-js/core` changeset (minor — additive API). Bundle delta expected small; measured per convention.
