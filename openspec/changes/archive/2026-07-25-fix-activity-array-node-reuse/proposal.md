## Why

When an `activity()` holds an **array** and drives one or more `activity.effect(...)` blocks, every `update()` recreates the effect's DOM nodes even when the observed content did not meaningfully change. The example app `apps/examples/activity-effect-nested-array` reproduces this: shuffling the array re-runs every subscribed effect and re-feeds fresh `Div(...)` context functions into the templating reconciler, so nodes are repainted (and, for keyed cases, torn down) instead of reused.

The root cause is confirmed: array-valued activities have no working change-detection path. `resolveCurrentValue` only shallow-clones plain `Object`s, and `shouldUpdate`'s `deep` branch gates on `isObject`, which explicitly excludes arrays — so array activities always fall through to strict `!==`. Because `randomizeArray` returns `array.slice()` (a new reference every time), `oldValue !== newValue` is always `true` and every effect re-renders unconditionally.

## What Changes

- **Array-aware change detection in `activity()`** — extend `resolveCurrentValue` and `shouldUpdate` so array values participate in the `deep` diff path: clone arrays to break reference-sharing, and element-compare so a same-content update does not cascade to subscribed effects.
- **Correct falsy-key handling in array reconciliation** — `ctxSnapshot.key || i` → `ctxSnapshot.key ?? i` in `handleArrayValue`, so a legitimate `0`/`''` key is not collapsed to the index.
- **`getContextForValue` name check kept strict (finding #2 alignment REFUTED).** Verification showed all component context functions are named exactly `contextFunction`, so the strict check already reads a mapped item's `key`. Broadening it to `endsWith('contextfunction')` would make snapshotting **invoke** an `activityContextFunction`, which has no dry-run mode and would set up a reactive subscription on a throwaway context (leak + spurious render). The strict check is protective and is left unchanged.
- **Enable value-keyed reconciliation for stable string keys in `handleArrayValue`** — the reconciler already looks up `childCtx` by `ctxSnapshot.key` and already has the move/`insertBefore` machinery; passing a `key` prop plus the `?? i` fix turns it on. When a consumer passes a stable string `key` to mapped items, a reordered item reuses **its own** DOM node (the node moves with the data) instead of the index-position node being repainted. No `key` → index fallback, unchanged. Empirically verified via a node-identity test across reorder and full reversal.
- **Remove leftover debug `console.log`s** in `activity.ts`, `get-text-update.ts`, and `component.ts` that fire on every reconciliation pass and distort DevTools observation.
- **Example app: pass `key: color`** to the mapped `Div`s in `activity-effect-nested-array` (and set `{ deep: true }`) to exercise and demonstrate per-item node reuse across shuffles.
- **Explicitly deferred (follow-ups, not in this change):**
    - **Numeric keyed reconciliation.** A numeric user `key` collides with the index-based fallback keyspace during the outer `${...}` interpolation's re-reconciliation of the effect's resolved elements; `appendChildContext` then deletes the childCtx stored under a numeric key that equals an index. This is the finding #3/#4 double-reconciliation and needs the larger refactor below. String/stable keys are unaffected.
    - `ctxScopes` inheritance in `appendChildContext` (finding #3 — the current non-inheritance is a needed safety net) and the html-parser `ContextFunction` diff always returning `true` (finding #4).

## Capabilities

### New Capabilities

- `activity-array-reactivity`: Change-detection and DOM-reconciliation behavior for `activity()` values that are arrays — when subscribed `activity.effect(...)` blocks re-render, and how existing DOM nodes are reused across `update()` calls.

### Modified Capabilities

<!-- None — no existing specs in openspec/specs/. -->

## Impact

- **Code:** `packages/core/src/activity.ts` (change detection + log removal), `packages/core/src/lib/helpers.ts` (`shallowDiffArray`), `packages/core/src/lib/templating/get-text-update.ts` (key fallback `?? i` + log removal), `packages/core/src/component.ts` (log removal). `packages/core/src/lib/context/helpers.ts` is **unchanged** (name-check kept strict — see What Changes).
- **Example app:** `apps/examples/activity-effect-nested-array/src/app.js` (pass `key: color` to mapped `Div`s).
- **Behavioral change:** Effects subscribed to an array activity will no longer re-render when a same-content array is pushed. Consumers relying on force-refresh should use the existing `force` option / `update(value, true)`.
- **Release:** `@loom-js/core` is published — a changeset is required (patch: bug fix, no API surface change).
- **Tests:** New/updated specs under `packages/core/tests/**` run via `pnpm -F @loom-js/core test-ci`.
