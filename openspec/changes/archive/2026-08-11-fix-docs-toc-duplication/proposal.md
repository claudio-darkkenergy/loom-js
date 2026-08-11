## Why

Clicking the TOC toggle (the `icon-list` button in the docs container's action-bar end slot) duplicates the entire docs container in the DOM. The root cause is a core reconciliation defect: `appendChildContext` returns `undefined` for **array-valued** interpolations, so `handleArrayValue` manufactures a throwaway `{}` parent context on every update. Every child of an array slot is then rebuilt from scratch each render, and every `activity.effect` child re-subscribes (there is no unsubscribe path), so after the first toggle a single `update()` drives multiple competing render passes — one of which re-inserts a second copy of the container that count-based cleanup never removes. This is a latent follow-up to the array-reactivity work in `a32352e`, not a regression from the element-components change.

## What Changes

- Fix `appendChildContext` (`packages/core/src/lib/context/helpers.ts`) so array values get a **persistent** child context instead of falling through to `undefined` — array slots must reuse the same context (and its `children` map) across re-renders.
- Guard `activity.ts` / `handleArrayValue` so re-rendering an array slot reuses existing child contexts and DOM nodes, and re-running an effect against an already-live context does not register a duplicate reactive subscriber.
- Add regression tests in `packages/core/tests` reproducing the toggle-duplication scenario (an effect-wrapped component whose template interpolates an array of children, toggled repeatedly → exactly one subtree in the DOM, stable node identity).
- Remove committed debug leftovers in `apps/loom/.../DocContainer/DocContainer.ts` (`console.log({ newChildren })` and scratch comments).

Out of scope (noted for follow-up proposals): a general unsubscribe/teardown story for `lib/reactive.ts`; the per-render listener creation in `useMediaQuery` / `watchRoute` hooks used by `DocsLayout`; and narrowing the docs layout effect boundary (see design.md D5 — the core fix makes the current boundary correct, and a narrower one needs teardown support first).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `activity-array-reactivity`: add requirements that (1) array-valued interpolations receive a persistent parent context — re-reconciling an array slot SHALL reuse existing child contexts and DOM nodes rather than rebuilding from a fresh context, and (2) re-running a render effect for a context that is already live SHALL NOT register an additional reactive subscriber, so one `update()` produces exactly one render pass per live effect and no duplicated subtrees.

## Impact

- `packages/core/src/lib/context/helpers.ts` (`appendChildContext`), `packages/core/src/lib/templating/get-text-update.ts` (`handleArrayValue`), `packages/core/src/activity.ts` (subscriber guard) — behavior-preserving for keyed reconciliation covered by the existing `activity-array-reactivity` spec; new tests must show existing specs still hold.
- `packages/core/tests/**` — new regression specs.
- `apps/loom/src/app/pages/docs/components/DocContainer/DocContainer.ts` — debug cleanup only; no API changes.
- No public API surface changes; patch-level release for `@loom-js/core`, patch for `@loom-js/loom` (private app, unpublished).
