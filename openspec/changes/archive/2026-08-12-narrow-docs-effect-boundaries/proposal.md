## Why

The docs layout wraps whole component subtrees in toggle-driven activity effects: every side-nav toggle re-renders `DocsSideNav` (nav + all items) and every TOC toggle re-renders `DocContainer` — the action bar, breadcrumbs, and the entire topic content — just to change one CSS class. The archived `fix-docs-toc-duplication` design deferred narrowing these boundaries because an imperative `watch` would have leaked a subscription per mount; `add-reactive-unsubscribe` (unsubscribers) and `add-unmount-teardown` (safe remount semantics) removed that blocker. This is the last deferred follow-up in that lineage.

## What Changes

- `DocsSideNav` keeps the declarative `sideNavToggleEffect` boundary (revised during review): its subtree is cheap to re-render, so the framework idiom wins per-site — the imperative pattern is reserved for the boundary with real re-render cost.
- `DocsLayout` converts from a `SimpleComponent` to a `component()` template component (it owns real structure — the two-pane flex wrapper — and needs lifecycle + `node()` access). Its `topicTocToggle.watch` toggles the `_open` class on the `DocContainer` root element; the `topicTocToggleEffect` wrapper is removed. `DocContainer` itself stays a `SimpleComponent` (pure delegator with an array of children — template conversion would hit the documented array limitation).
- TOC toggle clicks become single `classList` operations: zero re-renders of the topic content, zero refetches, DOM node identity preserved. Side-nav toggles stay declarative (cheap re-render, post-teardown leak-free).
- The TOC watch unsubscribes on unmount and re-registers on remount — no accumulation across docs entries (the manual-cleanup pattern `add-reactive-unsubscribe` was built for).

Out of scope: converting `DocContainer` or other docs components to element syntax (the `element-syntax-conversion` workstream's call), and any change to the toggle activities, hooks, or breakpoint behavior (`hook-setup-idempotence` semantics are untouched). Identified follow-up (separate change): a core _reactive attribute binding_ primitive — attr-level effects that update one attribute without re-rendering the subtree — which would let the TOC site return to declarative code as well.

## Capabilities

### New Capabilities

- `docs-toggle-boundaries`: the TOC toggle updates the docs layout by class mutation only — the container keeps its node identity, no content re-render or refetch occurs, and the watch subscription is released on unmount and re-established on remount without stacking; the side-nav toggle remains a declarative effect boundary whose class always reflects the toggle state.

### Modified Capabilities

<!-- none — hook-setup-idempotence behavior (memoization, run-once setup, breakpoint resync, state persistence) is unchanged -->

## Impact

- `apps/loom/src/app/pages/docs/layout.ts` — component() conversion, effect wrappers removed, TOC class watch.
- Verification is browser-based (apps have no test runner — same D6 posture as `fix-per-render-hook-leaks`): node-identity preservation across toggles, no-refetch, unsubscribe-on-exit behavior.
- No package changes; no changeset (`@loom-js/loom` private).
