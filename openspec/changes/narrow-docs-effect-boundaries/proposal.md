## Why

The docs layout wraps whole component subtrees in toggle-driven activity effects: every side-nav toggle re-renders `DocsSideNav` (nav + all items) and every TOC toggle re-renders `DocContainer` — the action bar, breadcrumbs, and the entire topic content — just to change one CSS class. The archived `fix-docs-toc-duplication` design deferred narrowing these boundaries because an imperative `watch` would have leaked a subscription per mount; `add-reactive-unsubscribe` (unsubscribers) and `add-unmount-teardown` (safe remount semantics) removed that blocker. This is the last deferred follow-up in that lineage.

## What Changes

- `DocsSideNav` owns its open-state: it registers `sideNavToggle.watch` on mount, toggling its `_open` class imperatively via its `node()` root, and unsubscribes on unmount. The `isOpen` prop and the `sideNavToggleEffect` wrapper in `DocsLayout` are removed.
- `DocsLayout` converts from a `SimpleComponent` to a `component()` template component (it owns real structure — the two-pane flex wrapper — and needs lifecycle + `node()` access). Its `topicTocToggle.watch` toggles the `_open` class on the `DocContainer` root element; the `topicTocToggleEffect` wrapper is removed. `DocContainer` itself stays a `SimpleComponent` (pure delegator with an array of children — template conversion would hit the documented array limitation).
- Toggle clicks become single `classList` operations: zero re-renders, zero refetches, DOM node identity preserved.
- Both watches unsubscribe on unmount and re-register on remount — no accumulation across docs entries (the manual-cleanup pattern `add-reactive-unsubscribe` was built for).

Out of scope: converting `DocContainer` or other docs components to element syntax (the `element-syntax-conversion` workstream's call), and any change to the toggle activities, hooks, or breakpoint behavior (`hook-setup-idempotence` semantics are untouched).

## Capabilities

### New Capabilities

- `docs-toggle-boundaries`: side-nav and TOC toggles update the docs layout by class mutation only — the affected DOM nodes keep their identity, no content re-render or refetch occurs, and the underlying watch subscriptions are released on unmount and re-established on remount without stacking.

### Modified Capabilities

<!-- none — hook-setup-idempotence behavior (memoization, run-once setup, breakpoint resync, state persistence) is unchanged -->

## Impact

- `apps/loom/src/app/pages/docs/layout.ts` — component() conversion, effect wrappers removed, TOC class watch.
- `apps/loom/src/app/pages/docs/components/DocsSideNav/DocsSideNav.ts` — internal open-state wiring, `isOpen` prop removed.
- Verification is browser-based (apps have no test runner — same D6 posture as `fix-per-render-hook-leaks`): node-identity preservation across toggles, no-refetch, unsubscribe-on-exit behavior.
- No package changes; no changeset (`@loom-js/loom` private).
