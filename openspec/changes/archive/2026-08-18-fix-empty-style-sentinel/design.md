# fix-empty-style-sentinel — design

## Context

Dynamic attributes are parsed with the placeholder token as their literal value (`style="⚡"`); the bound updater is expected to overwrite it on first application. Three style value shapes flow through `applyValue` in `get-attr-update.ts`:

- **string** → the `default` branch: `setAttribute('style', value)` — full replacement, token overwritten, no defect.
- **object** → per-entry `element.style.setProperty(...)` — mutating the CSSOM regenerates the attribute from `cssText`, which drops the token _only if at least one property is set_.
- **array** → `mergeAndSetStyleValues` flattens and applies entries the same way — same property-count dependence.

Two defects follow from the setProperty-only paths:

1. **Token leak.** A truthy value resolving to zero properties (`{}`, `[]`, `{ '--x': undefined }`, `[{ '--x': undefined }, undefined]`) passes the falsy-removal gate, sets nothing, and leaves `style="⚡"` to serialize. `PinkButton` hit exactly this (`[{ three custom props: undefined }, undefined]`) and carries a consumer-side conditional omission.
2. **Stale merge.** Object/array applications only ever add: a re-render whose new value drops a property leaves the old property applied. The string shape already replaces wholesale, so the three shapes disagree on re-render semantics.

The `$attrs` path (`applyAttrsEntry`) shares the same two style branches. It has no token to leak (special attrs are removed from the element at bind time), but it has the same stale-merge behavior.

## Goals / Non-Goals

**Goals:**

- The placeholder token never serializes into the DOM through a style binding, for any resolved value.
- One re-render semantic for all three style value shapes: the resolved value fully determines the inline style (declarative replacement).
- Symmetric behavior between the attr-slot path and the `$attrs` entry path.
- Remove the `PinkButton` workaround at the motivating site.

**Non-Goals:**

- Any change to the falsy-removal / zero-exemption gates (owned by the existing `attr-value-semantics` requirements).
- Any change to `$attrs` binding-registry mechanics or other attribute kinds.
- The array-reconciliation limitation (separately documented-deferred).
- Merging style with styles set outside the binding (e.g. imperative consumer writes) — the binding owns the inline style; that's the point of replacement.

## Decisions

### D1: Fix by replacement — clear inline style before applying, in both paths

Both object/array style branches (in `applyValue` and `applyAttrsEntry`) call `element.removeAttribute('style')` before applying the resolved properties. Applying zero properties then leaves the attribute absent; applying any regenerates it from a clean slate.

Alternatives considered:

- **Minimal token fix** — remove the attribute only when zero properties were applied (thread a set-count out of `mergeAndSetStyleValues`). Fixes the leak but preserves the stale-merge defect and the three-way shape asymmetry; more bookkeeping for a narrower result.
- **Token scrub** — after applying, remove the attribute if its value still contains `config.TOKEN`. Cheapest diff, but it special-cases the symptom, leaves stale merge in place, and couples the updater to the token representation.

Replacement wins: it fixes both defects with one primitive, aligns object/array with the string shape's existing behavior, and matches the framework's declarative idiom (the template value is the source of truth; there is no "previous state" to merge with).

### D2: Clear via `cssText = ''`, prune the attribute after applying _(amended during apply)_

As originally written, this decision chose `removeAttribute('style')` before applying. Implementation falsified it: Chrome serializes the style attribute **lazily** after `style.setProperty`, so a later `removeAttribute` can be resurrected as `style=""` by the pending flush — the `$attrs` replacement spec failed intermittently (empty attribute present) depending on suite scheduling. The durable shape is a shared `replaceInlineStyle(element, applyStyleProps)` helper:

1. `element.style.cssText = ''` — clears through the CSSOM, so there is no pending serialization to race (this also overwrites a parsed `style="⚡"` token value).
2. `applyStyleProps()` — the branch's existing property application.
3. `element.getAttribute('style') || element.removeAttribute('style')` — the read forces any lazy flush; an empty-resolving application then removes the attribute, matching the falsy-removal semantics one gate earlier.

All four branches (attr-slot and `$attrs`, object and array) route through the helper. Works identically in the browser and linkedom (SSR path).

### D3: Within-application merge is unchanged

`mergeAndSetStyleValues` still merges the _entries of one array value_ into each other (strings, objects, thunks, nested arrays) — that is the feature. Only cross-application accumulation is eliminated. The function keeps its name and contract.

### D4: `PinkButton` reverts to passing `style` through

The conditional-omission workaround (`style: allThreeUndefined ? style : [{...}, style]`) collapses back to the unconditional `[{...custom props}, style]` array. The empty-resolving case is now core's job. Pink patch changeset; core minor changeset (observable re-render behavior change).

## Risks / Trade-offs

- **[Behavior change: dropped properties now un-apply]** → A consumer relying on cross-render style accumulation would regress. No first-party code does (the conversion's parity harness covers pink + the loom app); the change is called out in the core changeset. This is the documented intent, not a side effect.
- **[Attribute churn: remove + re-add per application]** → Style re-applications now touch the attribute twice. Inline-style writes are rare and cheap relative to reconciliation; no measured path regresses. Per repo convention, no tuning without measurement.
- **[linkedom serialization drift]** → The SSR DOM must agree that remove-then-set leaves no attribute when nothing is set. `removeAttribute`/`setProperty` are both plain linkedom surface; the existing SSR parity tests would surface drift.

## Open Questions

None — the shape audit (three value shapes, two paths) is complete and the decisions above close the proposal's scope.
