## Context

Follow-up to `fix-activity-array-node-reuse`, which shipped array change-detection and **string**-keyed reconciliation and documented numeric keys as a known limitation. This change fixes the underlying double-reconciliation so keyed reuse is correct for all key types.

Confirmed mechanism (instrumented `handleArrayValue` tracing):

- **Pass A** — `activity.effect(...)`'s `renderEffect` → `textUpdater(ctx.root, arrayOfContextFunctions, ctx)` → `handleArrayValue` stores each child context in `parentCtx.children` under `ctxSnapshot.key ?? i`.
- **Pass B** — the outer `${...}` interpolation's updater (`getTextUpdate` closure in `get-text-update.ts`, driven by the html-parser reactive proxy in `html-parser.ts`) re-runs `textUpdater` with the **resolved DOM elements**. Elements are not context functions, so `appendChildContext` runs `parentCtx.children.delete(chosenKey)`; with keyless elements `chosenKey = i`. Numeric user keys equal to indices are thereby deleted, so the next reorder recreates those nodes.

The html-parser interpolation diff (`html-parser.ts`) returns `true` unconditionally for two `ContextFunction`s (finding #4), which is what keeps re-triggering Pass B.

Constraints: this is the shared reconciliation core — every consumer (`apps/loom`, all examples, `@loom-js/tags`, `@loom-js/pink`) exercises it. Zero runtime deps. `noUncheckedIndexedAccess` strict TS.

## Goals / Non-Goals

**Goals:**

- Reconcile an effect-owned array exactly once per update; stop Pass B from destructively editing the effect's `children` map.
- Make numeric keyed reconciliation reuse nodes across reorder (un-skip the existing test).
- Keep string-keyed reconciliation and array change-detection behavior from the prior change intact.

**Non-Goals:**

- Broadening `getContextForValue`'s name check (already refuted — must stay strict so `activityContextFunction` is never invoked by snapshotting).
- General deep structural array diffing.
- A full keyed-list diffing rewrite; prefer the smallest change that removes the destructive re-reconciliation.

## Decisions

Three candidate approaches — to be chosen during apply after spiking, in rough order of preference:

### Decision A (preferred): Make `appendChildContext` cleanup non-destructive to keyed entries

Only delete a child context when the slot is genuinely no longer a keyed item — not merely because this pass sees a resolved element. Options: skip the `else`-branch delete when `value` is a DOM `Node` (Pass B), or track which keys are live for the current update and delete only stale ones after the pass. Smallest blast radius; leaves the two-pass structure intact but harmless.

- **Risk:** the delete also handles legitimate component→text transitions; must preserve that. → Mitigate by keying the delete on "value is a Node/element" vs "value is a plain text/primitive that replaced a component."

### Decision B: Stop Pass B at the html-parser diff (finding #4)

Change the `isContextFunction(old) && isContextFunction(new)` case in `html-parser.ts` from always-`true` to an identity/fingerprint comparison so the outer interpolation does not re-fire for the effect's unchanged `ContextFunction`. Addresses the root re-trigger, but the html-parser diff is load-bearing for all interpolations — higher regression risk.

### Decision C: Give the effect subtree its own child-context scope

Reconcile the effect's array into a `children` map owned by the effect's ctx that the outer interpolation cannot reach, so Pass B (if it still runs) can't delete Pass A's entries. May require `ctxScopes` re-keyed by `(templateFunction, key)` (finding #3) — the largest change; only if A and B prove insufficient.

**Plan:** spike Decision A first (guard the destructive delete), verify the skipped numeric test passes and the full suite stays green; escalate to B, then C only if needed.

## Risks / Trade-offs

- **Shared-core regression** → Full `test-ci`, plus manual runs of `apps/loom` and every example; watch text-node/fragment reconciliation and component→text transitions specifically.
- **Fixing Pass B changes update timing/counts** → Add an assertion that an effect resolves each item once per update; verify no missed updates in nested-effect cases (existing `activity.spec.ts` nested test).
- **`ctxScopes` re-keying (Decision C) collides siblings** → Only pursue with `(templateFunction, key)` keying; covered by a sibling-components-sharing-a-template test.

## Migration Plan

1. Reproduce with the un-skipped numeric test (Red).
2. Apply Decision A; run `test-ci`; un-skip numeric test → Green.
3. If insufficient, escalate to B, then C.
4. Manual: run `apps/loom` + examples; confirm no reconciliation regressions.
5. Changeset (patch/minor) for `@loom-js/core`; note the limitation from the prior change is resolved.

## Open Questions

- Is Decision A alone sufficient, or does the redundant Pass B need to be eliminated (B) for correctness/perf rather than just made harmless?
- Does any real consumer rely on the current always-`true` html-parser `ContextFunction` diff behavior?
