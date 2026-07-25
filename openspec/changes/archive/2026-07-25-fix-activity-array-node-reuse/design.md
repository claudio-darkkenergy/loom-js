## Context

`@loom-js/core`'s `activity()` is a pub/sub reactive primitive. Its `shouldUpdate(oldValue, newValue)` decides whether an `update()` re-runs subscribed `activity.effect(...)` blocks, and `resolveCurrentValue` produces the stored "current" value. Both were written for scalars and plain objects only:

- `resolveCurrentValue` clones a value **only** when `isObject(value) && value.constructor.name === 'Object'`. Arrays are returned as-is. A `@TODO` on `activity.ts:37` already flags this.
- `shouldUpdate`'s content-aware branch is `deep && isObject(oldValue) && isObject(newValue)`, and `isObject` (`lib/helpers.ts:18-19`) returns `false` for arrays. So arrays always fall through to strict `!==`.

The example app's `randomArray` activity returns `array.slice()` on every `update()`, so `oldValue !== newValue` is always `true`; every effect re-renders regardless of whether its observed slice changed. Downstream, the re-render feeds fresh `Div(...)` context functions into `handleArrayValue`, which repaints per-index nodes. This is the confirmed primary driver of the "nodes recreated" symptom.

Separately, three low-risk latent defects were confirmed in the reconciliation/context path (`|| i` vs `?? i`, an inconsistent `contextFunction` name check, and leftover debug logs). Two larger issues (`ctxScopes` non-inheritance, html-parser's always-`true` contextFunction diff) are real but out of scope here.

Constraints: `@loom-js/core` has zero runtime dependencies and ships ES+CJS bundles via rollup; tests run under `@web/test-runner` + puppeteer (`packages/core/tests/**`); repo prettier config is authoritative for formatting.

## Goals / Non-Goals

**Goals:**

- Make array-valued activities participate in content-level change detection so a same-content `update()` does not cascade re-renders (fixes the recreation symptom at its source).
- Reference-isolate array values so `value()` / stored current value cannot be mutated to defeat change detection.
- Fix the confirmed low-risk latent bugs: `ctxSnapshot.key ?? i`, and the `getContextForValue` name-check inconsistency.
- Remove leftover debug `console.log`s.
- Preserve existing behavior for scalars, plain objects, and the `force` path.

- **Enable value-keyed reconciliation** for consumers that pass a `key` prop, so a reordered item reuses its own DOM node (see Decision 6). This is achieved by the same #2 fixes plus consumers supplying keys — not a new subsystem.

**Non-Goals:**

- **No `ctxScopes` inheritance** in `appendChildContext` (finding #3) — the current non-inheritance is a safety net that keyed reconciliation actually depends on; changing it requires re-keying `ctxScopes` first.
- **No change** to the html-parser `ContextFunction` diff returning `true` (finding #4).
- No change to `Map`/`Set` handling beyond what falls out of the array work.

## Decisions

### Decision 1: Diagnosis — repaint vs. teardown (resolved by code trace)

A full trace of `handleArrayValue` → `resolveValue` → the Div `contextFunction` shows same-length shuffles **reuse** the per-index `childCtx.root` node and repaint it; nodes are not torn down. So finding #1 (the change-detection cascade) is the driver of the *unnecessary* re-renders, and per-item reuse under reorder is a keying question, not a teardown bug. This diagnosis is codified as tests (section 5) rather than throwaway `data-id` logging: the keyed reorder test asserts element-instance identity across shuffles, which is the same evidence a `data-id` probe would give, but permanent and regression-guarding.

- **Alternative considered:** Ship a temporary `data-id` probe in the example first. Rejected — a node-identity assertion in the test suite is strictly better (durable, CI-enforced) and the code trace already settles the repaint-vs-teardown question.

### Decision 2: Array change detection via clone + element compare, gated by `deep`

Extend `resolveCurrentValue` to also clone arrays (`value.slice()` / `[...value]`), and add an array branch to `shouldUpdate` that runs a length + positional strict-equality element compare. Gate the content comparison on the existing `deep` option so default (`deep: false`) array activities keep strict-`!==` semantics and are not silently changed.

- **Why `deep`-gated:** Matches the existing object contract (object content-diff also requires `deep: true`). Avoids a surprising behavior change for consumers who rely on "new reference ⇒ re-render".
- **Why shallow element compare (not deep):** The example and the reported symptom are arrays of primitives / stable context-function references; a positional shallow compare resolves the cascade. Deep per-element structural diffing is heavier and unneeded here — can be a follow-up if array-of-objects cases surface.
- **Alternatives considered:** (a) Always content-compare arrays regardless of `deep` — rejected as a behavior change for existing consumers. (b) Reference-freeze arrays like the initial value — rejected; the values are legitimately replaced each update.

### Decision 3: Implement the array diff as a small helper in `lib/helpers.ts`

Add e.g. `shallowDiffArray(oldArr, newArr)` alongside `shallowDiffObject`, and keep `shouldUpdate` a thin dispatcher. Consider a broadened `isObjectOrArray`/local guard rather than changing `isObject` itself (other call sites depend on `isObject` excluding arrays — e.g. `Object.freeze` guard, transform detection).

- **Why not change `isObject`:** `isObject` is used across `activity.ts` (freeze guard, options detection) and `html-parser.ts`. Widening it to include arrays would have unintended ripple effects. Keep the array path explicit and local.

### Decision 4: `?? i` kept; `getContextForValue` name-check alignment REFUTED

`ctxSnapshot.key || i → ?? i` (get-text-update.ts) is a correctness fix and is kept.

The proposed alignment of `getContextForValue` to `endsWith('contextfunction')` (finding #2) was **refuted during implementation and reverted**:

- **All** component context functions are named exactly `contextFunction` (component.ts declares `function contextFunction(...)` regardless of component; resolve-value.ts even documents "with this name, exactly"). So the original strict `=== 'contextFunction'` check **already** matched the mapped `Div`s and read their `key` — there was no `divContextFunction`.
- `activity.effect(...)` returns `function activityContextFunction`, which has **no dry-run mode** — it unconditionally calls `reactiveEffect(...)`. Broadening the check would make `getContextForValue` (called for every array item) invoke it with a throwaway `{}` context, subscribing that dead context to the activity forever (memory leak + a render into a dead root every update). The example's first `Ul` has an `effect(...)` as an array child, so this path is real.
- Conclusion: the strict check is **protective**, not a bug. Keyed reconciliation for stable string keys works via the existing check + a `key` prop. Locked in by a test asserting `getContextForValue` snapshots a component context function's key but does **not** execute an `activityContextFunction`.

### Decision 6: Value-keyed reconciliation works for stable string keys; numeric keys are a follow-up

Tracing a shuffle confirmed nodes are **not** recreated — `handleArrayValue` recovers `childCtx` by key and the item's `contextFunction` reuses the persisted `childCtx.root`. The reconciler already contains value-keyed lookup and node-move machinery. With consumers passing a stable string `key` plus the `?? i` fix, a reordered item reuses its own node and moves to its new index. **Empirically verified**: node-identity tests pass across a rotation reorder and a full reversal for string keys.

- **Numeric keys — known limitation (follow-up).** Instrumented tracing revealed a second, spurious reconciliation pass: the outer `${...}` interpolation updater (get-text-update.ts `getTextUpdate` closure → the html-parser reactive path, finding #4) re-reconciles the effect's **resolved DOM elements** (not context functions) into the **same** `parentCtx.children` map. Those element items are not context functions, so `appendChildContext` takes its `else` branch and `children.delete(chosenKey)`; with keyless items the `chosenKey` is the index. When a user key is **numeric** and equals an index (e.g. `1`, `2`), that delete destroys the keyed childCtx, so the next reorder recreates the node. String keys never collide with numeric indices, so they are unaffected. Fixing this requires resolving the double-reconciliation (findings #3/#4) — a larger refactor deliberately out of scope. Captured as `it.skip` + a documented spec limitation + changeset note.
- **Why safe (no `ctxScopes` refactor):** each keyed `childCtx` carries no `ctxScopes`, so `component.ts` `scopedCtx` stays `null` and `ctx = liveCtx` — siblings sharing a `templateFunction` never collide. Finding #3's non-inheritance is the safety net keyed reconciliation relies on; #3 stays a non-goal.
- **Alternative considered:** Chase the numeric-key/double-reconciliation fix now. Rejected — it is the finding #3/#4 refactor the original request said to ask before doing; the primary symptom fix (change detection) and string-keyed reuse ship cleanly without it.

### Decision 5: Remove debug logs as part of this change

Delete the three `console.log`s (activity.ts `renderEffect`, get-text-update.ts `textUpdater`, component.ts `contextFunction`). They are marked `@Remove` / dead debug code and pollute the DevTools signal used to verify the fix.

## Risks / Trade-offs

- **Behavior change: some effects stop re-rendering** → Only under `deep: true` for same-content arrays, which is the intended fix. Mitigation: documented in the proposal; `force` / `update(value, true)` remains the escape hatch. Existing `deep: false` array activities are unaffected.
- **Element compare misses deep mutations of array-of-objects** → Out of scope; shallow positional compare is sufficient for the reported case. Mitigation: note as a follow-up; `deep: false` (default) consumers are unchanged, and object-element identity still triggers updates.
- **Numeric keyed reconciliation silently falls back to recreation** → A numeric `key` colliding with an index is destroyed by the outer interpolation's re-reconciliation delete. Mitigation: documented as a known limitation (spec + changeset + `it.skip`); string/stable keys work. Consumers should use string keys until the follow-up lands.
- **Broadening `getContextForValue` would leak activity subscriptions** → Avoided by keeping the strict name check (Decision 4); locked in by a test that asserts an `activityContextFunction` is not executed by snapshotting.
- **Example app `key` change ships in a released example** → Low risk; the example is a demonstration app, `key` is a supported prop (string colors, no numeric-key collision), and index fallback covers consumers who omit it.

## Migration Plan

1. Land the core fixes (Decisions 2–6) behind existing `deep`/`force` semantics and opt-in `key` — no public API change; index fallback preserves current behavior.
2. Add `key: color` to the example app's mapped `Div`s to exercise keyed reuse.
3. Add core tests (same-content no-rerender, reference isolation, keyed reorder node-identity, falsy-key, name-check).
4. Add a changeset (patch) for `@loom-js/core`.
5. Rollback: revert the core commit; `deep`-gating and `key` opt-in mean default behavior is unchanged, so blast radius is limited to `deep: true` array activities and consumers who pass `key`.

## Open Questions

- Should the array element compare eventually be deep (structural) for array-of-objects activities, or is positional shallow compare the permanent contract? (Deferred; revisit if a consumer needs it.)
- Does the existing `handleArrayValue` move logic handle all reorder permutations correctly once keys drive reuse, or does it need a narrow ordering fix? (Resolved during apply by the reorder node-identity test.)
