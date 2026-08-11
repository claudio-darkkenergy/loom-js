## Context

`appendChildContext` (`packages/core/src/lib/context/helpers.ts:8-40`) has three outcomes: context functions get a persistent child context from `parentCtx.children`; resolved DOM `Node`s are left alone; everything else deletes the slot's child context and **returns `undefined`**. Arrays land in that last branch.

The array path then compounds the problem: `set-reactive-updates.ts` passes the `undefined` result as the context for `textUpdater`, and `handleArrayValue` (`get-text-update.ts:44-122`) calls `appendChildContext(parentCtx, ...)` per item — where the `parentCtx: ComponentContextPartial = {}` default parameter manufactures a brand-new empty parent on every update. Consequences per re-render of an array slot:

1. Every item's child context is empty → `component.ts` sees no `liveCtx.root` → full template re-instantiation (new DOM for the whole subtree).
2. Every `activityContextFunction` item sees a fresh `ctx` → `activity.ts:115` re-registers `renderEffect` with `reactiveEffect` — and `lib/reactive.ts` has no unsubscribe, so subscribers accumulate.
3. Once >1 render effect is live for one activity, a single `update()` runs multiple passes over drifting `liveNode` arrays; a stale pass re-inserts a subtree that the count-based cleanup (`liveNode.slice(valueArray.length)`) never removes.

The docs page hits this because `DocsLayout` wraps the whole `DocContainer` in `topicTocToggleEffect`, and the container's `${children}` slot is an array (`[PinkActionBar(...), children]`, where `children` is itself an array of two `topicEffect` children). First toggle: full rebuild + double subscription. Second toggle: duplicated `docs-container`.

## Goals / Non-Goals

**Goals:**

- Array-valued interpolations reuse a persistent context across re-renders, so child contexts, DOM nodes, and activity subscriptions survive an update instead of being rebuilt.
- Repeated toggling of an effect-wrapped component yields exactly one subtree with stable node identity.
- Regression coverage in `packages/core/tests` for the toggle/duplication scenario, written test-first.
- Remove committed debug leftovers in `DocContainer.ts`.

**Non-Goals:**

- A general unsubscribe/teardown mechanism for `lib/reactive.ts` or pruning of `scopedActions` — follow-up proposal.
- Fixing the per-render listener creation in `useMediaQuery` / `watchRoute` (`DocsLayout` hooks) — follow-up proposal.
- Narrowing the docs layout effect boundary. After the core fix, re-rendering `DocContainer` correctly reuses DOM; a narrower boundary (imperative class toggle via `watch`) would introduce its own per-mount subscription leak until teardown exists. Deferred.

## Decisions

**D1 — Fix at `appendChildContext`, with a dedicated array branch.** Add an `Array.isArray(value)` case that creates/reuses a persistent child context, exactly like the context-function branch. Alternatives considered: (a) removing the `= {}` default in `appendChildContext` and threading a real parent from `handleArrayValue`'s callers — but the `undefined` originates in `appendChildContext` itself, and every caller would need the same array logic; (b) patching only `handleArrayValue` to fall back to `valueCtx` — leaves `set-reactive-updates.ts` still passing `undefined`. Fixing the origin keeps one source of truth for context creation.

**D2 — Separate keyspace for array-slot contexts.** Store the array slot's context under a derived key (`` `${key}[]` ``) rather than the plain slot key. A slot can change kind between renders (component ⇄ array ⇄ primitive); reusing a component's context object as an array's parent context (or vice versa) would hand one kind's `root`/`chunks`/`ctxScopes` state to the other. With a distinct keyspace, kind changes cannot collide. To preserve the existing "stale context is dropped" semantics: the array branch deletes the plain `key` entry, and the primitive branch (and array branch's counterpart) deletes `` `${key}[]` `` alongside. Alternative considered: a boolean marker on the context (`isArraySlot`) with recreate-on-mismatch — works, but widens the `ComponentContextPartial` type and needs a mismatch check in two places; the keyspace split is contained in one function.

**D3 — No change to `activity.ts`.** The existing guard (`if (!ctx.root || !scopedActions.has(ctx))`) already prevents duplicate subscription — it just never engages because the context is thrown away each render. Once contexts persist (D1/D2), the `else` branch (update action scope, call `renderEffect` directly) does exactly the right thing. Adding a redundant guard would mask future context-persistence regressions rather than surface them.

**D4 — Test-first regression specs (tdd-workflow).** New spec file under `packages/core/tests` reproducing the shape that broke: an `activity.effect` wrapping a component whose template interpolates an array of children (including a nested array and nested `activity.effect` items), toggled repeatedly. Assert: single subtree (no duplicate roots), stable element identity across toggles, and one effect invocation per `update()`. These must fail on current `main` behavior before the fix lands, then pass after, alongside the full existing suite (`test-ci` + `type-check` + `type-check-tests`).

**D5 — App cleanup only, no behavioral app change.** Remove `console.log({ newChildren })` and scratch comments from `DocContainer.ts`. The layout's effect boundary stays (see Non-Goals). The proposal's "narrow the effect boundary" bullet is superseded by this decision — recorded here per fluid-workflow convention.

## Risks / Trade-offs

- [Persistent array contexts retain child contexts for indices that later disappear (shrinking arrays)] → Same no-teardown posture as the rest of the context tree today; DOM is still trimmed by count. Accepted; the reactive-teardown follow-up is the real fix.
- [Keyspace split changes `children` map contents, which keyed-reorder logic reads] → The reorder path operates on _item_ contexts under the array's own context, not on the slot-level key; guarded by running the full existing `activity-array-reactivity` suite unchanged.
- [Duplication might have a second contributing cause not covered by the core fix] → Verify in the running app (`pnpm dev`, docs page, repeated TOC toggles) before closing tasks, not just in unit tests.
- [`b61b1d6` (element components) suspected by the user but ruled out by diff inspection] → If app verification still shows duplication after the fix, re-open investigation before archiving rather than stacking speculative patches.
