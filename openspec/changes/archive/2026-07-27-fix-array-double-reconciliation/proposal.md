## Why

Keyed array reconciliation in `@loom-js/core` works for stable **string** keys but silently breaks for **numeric** keys, falling back to node recreation on reorder. The change `fix-activity-array-node-reuse` shipped string-keyed reuse and documented this as a known limitation.

Instrumented tracing pinned the root cause: an array driven by `activity.effect(...)` is reconciled **twice** into the **same** `parentCtx.children` map:

1. **Pass A** — the effect's `renderEffect` calls `textUpdater` with the array of **context functions**; `handleArrayValue` stores each child context under its key (`ctxSnapshot.key ?? i`).
2. **Pass B** — the outer `${...}` interpolation updater (`getTextUpdate`'s closure → the html-parser reactive path) re-runs `textUpdater` with the **already-resolved DOM elements**. These are not context functions, so `appendChildContext` takes its `else` branch and `children.delete(chosenKey)`. With keyless elements, `chosenKey` is the **index** — so a numeric user key equal to an index (`1`, `2`, …) has its child context **deleted**, and the next reorder recreates the node.

This is the finding #3/#4 double-reconciliation. Fixing it makes keyed reconciliation correct for all key types and eliminates a wasteful redundant reconciliation pass on every parent-driven update.

## What Changes

- **Eliminate or neutralize the redundant Pass B** so an `activity.effect(...)` subtree is reconciled once (by the effect that owns it), not re-reconciled by the outer interpolation with its resolved elements. Options to be decided in design: (a) make the html-parser interpolation diff bail out for the effect's `ContextFunction`/its resolved output (finding #4 — currently always returns `true`), or (b) give the effect subtree its own child-context scope so the outer pass cannot touch the effect's `children` map.
- **Make `appendChildContext`'s cleanup non-destructive to keyed siblings** — the `else` branch's `children.delete(key)` must not delete a child context that still corresponds to a live keyed item. At minimum, resolved-element items (Pass B) must not delete keyed entries created by context-function items (Pass A).
- **Support numeric keys end-to-end** — a numeric `key` colliding with an index must not lose its child context; reordering a numeric-keyed list reuses each item's DOM node.
- **Un-skip and pass** the `it.skip('reuses numeric-keyed nodes across a reorder')` test from `fix-activity-array-node-reuse`, plus add coverage that the effect subtree is reconciled once.
- **Possibly:** `ctxScopes` inheritance in `appendChildContext` (finding #3) if required by the chosen approach — but only with `ctxScopes` re-keyed by `(templateFunction, key)` so sibling components sharing a `templateFunction` don't collide.

## Capabilities

### Modified Capabilities

- `activity-array-reactivity`: Extend the keyed-reconciliation requirement so per-item DOM node reuse across reorder holds for **numeric** keys as well as string keys, and add a requirement that an effect-owned array subtree is reconciled exactly once per update (no destructive re-reconciliation by the outer interpolation).

## Impact

- **Code:** `packages/core/src/html-parser.ts` (the `isContextFunction` diff returning `true`), `packages/core/src/lib/context/helpers.ts` (`appendChildContext` cleanup semantics; possibly `ctxScopes`), `packages/core/src/lib/templating/get-text-update.ts` (`handleArrayValue` keyspace), and possibly `packages/core/src/component.ts` (`ctxScopes` scoping).
- **Risk:** Higher than the prior change — touches the shared templating/reconciliation core that every consumer exercises. Requires broad regression testing (`pnpm -F @loom-js/core test-ci`) and manual runs of `apps/loom` and the examples.
- **Release:** `@loom-js/core` patch/minor via changeset.
- **Depends on:** `fix-activity-array-node-reuse` (this change removes the limitation that one documented).
