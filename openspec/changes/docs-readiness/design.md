# docs-readiness — design

## Context

Two independent, narrow gaps, both about to be exercised by the docs pages in `apps/loom`:

**Hash navigation.** `Router.route()` (`packages/core/src/router.ts`) snapshots the location, performs `pushState`/`replaceState`, and updates the location activity only when `didRouteChange(snapshot)` — a comparison that deliberately excludes `hash` so hash-only URL changes don't re-run route matching or reload page content. But `route()` also calls `preventDefault()` unconditionally, so the browser's native anchor jump is suppressed and nothing replaces it: a hash-only navigation updates the URL and stops there. History: an `onHash` callback existed in the pre-refactor `routing.ts` and was removed in `da64ade`; even that never scrolled — it only notified. The new window-keyed Router (from `unify-routing`) has no hash consideration at all. Initial page loads have a related problem unique to SPAs: the browser's native anchor scroll fires before lazily-imported route content exists, so `/guide#setup` loads scrolled to the top.

**Zero-valued attributes.** The text path already preserves zero — `resolve-value.ts` resolves with `value || value === 0 ? value : ''`. But both attribute paths in `get-attr-update.ts` gate on `!Boolean(value)` → `removeAttribute` _after_ calling `resolveValue`: the attr-slot path (~line 104) and the `$attrs` entry path (`applyAttrsEntry`, ~line 307). So `tabindex={0}`, `min={0}`, `maxlength={0}` remove the attribute, and `value={0}` never reaches its own special case (the falsy gate sits above the `switch`). Three `@TODO Handle number zero - 0?` comments mark exactly these sites.

Constraints: zero runtime dependencies; the layered routing pipeline semantics (one history pipeline per window, `didRouteChange` gate) are spec'd by `spa-routing` and must not regress; server rendering resolves windows through the injectable DOM provider, so anything DOM-shaped must stay inside a DOM scope and tolerate provider DOMs lacking browser-only APIs.

## Goals / Non-Goals

**Goals:**

- Same-page anchor clicks routed through `route()`/`onRoute` scroll to their target.
- Cross-page navigations carrying a hash scroll after the routed content renders.
- Initial loads with a `#fragment` scroll after the first routed render.
- `0` renders as an attribute value everywhere attributes are set from template values.

**Non-Goals:**

- No reactive observability of hash-only navigations (`watchLocation`/`locationEffect` do not fire for them — see Decision 2).
- No scroll-position restoration on popstate traversal — the browser's native `scrollRestoration` handles it.
- No smooth-scroll opinion — `scrollIntoView()` respects the page's `scroll-behavior` CSS; apps own the aesthetics.
- No `parseQuery` / search-param work (the dormant `@TODO` at `router.ts:243` stays dormant).
- No change to which values are _stringified how_ — only to the remove-vs-set gate.

## Decisions

### D1 — The hash branch lives in `Router.route()`, as the else of the existing gate

`route()` already computes `didRouteChange(locationSnapshot)`. The addition mirrors the shape the old `routing.ts` had:

- Route changed → update the location activity (existing), and if the new location carries a hash, record it as the router's _pending hash_ for post-render scrolling (D3).
- Route unchanged and the hash changed (or is present) → scroll to the anchor immediately.

Alternative considered: a `hashchange`/location-watch listener. Rejected — `pushState` does not fire `hashchange`, and hash-only navigations never reach the location activity (D2), so `route()` is the only place the event exists.

### D2 — Hash-only navigations do not feed the activity pipeline

`didRouteChange` keeps excluding `hash`, and hash-only navigations do not call `locationActivity.update()`. Rationale: the pipeline wires location → match transform → route activity unconditionally, and the transform updates the route activity with a fresh `RouteValue` object on every run — so a hash-only location update would re-fire every `routeEffect`/`watchRoute` subscriber (and re-render their content) for a navigation that didn't change the route. Suppressing that cascade would mean re-architecting the transform's update policy, which is out of proportion for this change.

Trade-off: apps cannot reactively observe hash-only navigations (e.g. for TOC highlighting). Accepted — scroll-position tracking via `IntersectionObserver` is the idiomatic tool for that, and a hash layer in the pipeline remains a clean future extension.

### D3 — Deferred scroll = a single pending hash consumed after the routed content settles

The Router records `pendingHash` when (a) a cross-page `route()` call carries a hash, or (b) at construction time when the initial location carries a hash (covers initial load; construction happens on first routing use inside a DOM scope). It is consumed — scroll attempted once, then cleared — after the page-import activity delivers rendered content, scheduled on the next animation frame so the mount has committed. If the target element doesn't exist by then, silently no-op; no retry loop, no timeout. A subsequent navigation overwrites any unconsumed pending hash.

Alternatives considered: retry/poll until the element appears (rejected: unbounded, and a page that renders its anchor late is an app-level concern); `MutationObserver` (rejected: machinery disproportionate to a docs anchor).

### D4 — Anchor resolution follows the native algorithm's useful core

Target = `document.getElementById(decodeURIComponent(hash.slice(1)))`, scrolled via `element.scrollIntoView()`. An empty fragment (`#`) scrolls to the top (`win.scrollTo(0, 0)`), matching native behavior. No `[name=...]` fallback — `id` anchors are the modern contract, and docs content is ours.

Server safety: the scroll paths run only inside `route()` (a click handler — never called during server renders) and the pending-hash consumption (guarded: only attempt when the element exposes `scrollIntoView`, so provider DOMs without CSSOM view APIs no-op cleanly).

### D5 — The zero fix mirrors the text path's predicate at both gates

Both falsy gates change from `!Boolean(value)` to "remove unless `value || value === 0`" — the exact predicate `resolve-value.ts` already uses, so attribute and text semantics converge on one rule. `false`, `null`, `undefined`, `''`, and `NaN` still remove the attribute (boolean-attribute support intact); `0` falls through to the existing `switch`, where the default path stringifies it (`"0"`) and the `value` case sets the element's value prop. The three `@TODO` comments come out.

Alternative considered: an allowlist of numeric attributes (`tabindex`, `min`, …). Rejected — `0` is never a "please remove this attribute" signal for _any_ attribute; `false`/`undefined` express that.

## Risks / Trade-offs

- [Pending hash consumed before slow content renders its anchor] → Single-attempt, silent no-op is the documented contract; apps rendering anchors asynchronously after mount own their own scroll. Docs pages render anchors synchronously with content.
- [Hash-only navs invisible to `watchLocation`] → Accepted per D2; documented as a future pipeline extension.
- [`value={0}` behavior change could surprise an existing consumer relying on removal] → Removal-for-zero was flagged as a bug by the code's own TODOs; `false`/`undefined` remain the removal idiom. Changeset notes it.
- [Animation-frame scheduling in provider DOMs] → Fall back to a microtask when `requestAnimationFrame` is absent; combined with the `scrollIntoView` guard, server renders no-op.

## Open Questions

None — both fixes are fully scoped.
