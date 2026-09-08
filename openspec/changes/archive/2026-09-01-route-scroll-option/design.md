# Design — route-scroll-option

## Context

`route()` (`packages/core/src/router.ts`) owns the native anchor jump its `preventDefault` suppresses. Two paths scroll: a same-page fragment scrolls immediately via `scrollToFragment(win, fragment)`; a cross-page navigation (or initial load) stores `pendingFragment` and `consumePendingFragment()` scrolls after the routed content renders. A bare `#` scrolls to the top. `OnRouteOptions` is `{ href?, replace? }`; `RouteLink` and `redirect` call `route` without a scroll concern. The `spa-routing` spec pins the scroll as a requirement with five scenarios.

The first consumer is an in-page "copy link" anchor beside each docs heading (uncommitted `apps/loom` work): it must go through `route` — a native hash jump fires `popstate`, the location layer re-renders the docs content, and the control's copied state is lost — yet the scroll it inherits defeats the control's own feedback.

## Goals / Non-Goals

**Goals:**

- Let a `route()` caller keep the History update and quiet pipeline of a fragment navigation while declining the scroll.
- Define the fragmentless contract: forward SPA navigation lands at top; history traversal restores.
- Deferred fragment scrolls fire when tracked content exists, not before.
- Zero behavior change for existing callers (default `true`).
- Cover the opt-out in both scroll paths (immediate and deferred) and the bare-`#` case.

**Non-Goals:**

- Scroll behavior tuning (smooth/instant, offsets for sticky headers) — CSS `scroll-behavior` and `scroll-margin` already own that.
- A `RouteLink` prop for the option — `RouteLink` is the zero-config anchor; a caller who needs the option writes the handler (one line). Revisit if a second consumer appears.
- Changing `redirect(href)`.

## Decisions

### D1 — `scroll?: boolean` on `OnRouteOptions`, default `true`

An option on the existing options object, beside `href`/`replace`, rather than a new function (`routeWithoutScroll`) or a module-level setting. It is per-activation state that only the caller knows, and `route(event, { scroll: false })` reads at the call site exactly like `{ replace: true }` does. _Alternative considered:_ a `data-` attribute on the anchor read by `route` — rejected: `route` is also called with `null` events and explicit `href`s, and DOM-derived config is invisible to the type surface.

### D2 — The opt-out suppresses every fragment scroll the navigation would trigger

`scroll: false` skips the same-page `scrollToFragment`, and for a route-changing navigation it stores no `pendingFragment` (a stale one is still dropped, as today). The bare-`#` top-scroll is a fragment scroll too and is suppressed alike. One switch, one meaning: "this navigation does not move the viewport". _Alternative considered:_ suppress only the same-page case — rejected: the option's meaning would depend on whether the href happens to change the route, which the caller can't always know.

### D2b — Fragmentless navigations scroll to top, instantly, after render (added 2026-08-31)

A `route()` that changes the route and carries no fragment scrolls the window to the top once the routed content renders (the same deferred point as `consumePendingFragment`, so the scroll lands on the new page, not the old one). Instant (`scrollTo` with explicit non-smooth behavior): page-to-page motion mimics a fresh document load; the app's `scroll-behavior: smooth` CSS keeps animating _anchor_ jumps only. `popstate`/history traversal is untouched — `pushState` entries participate in the browser's automatic scroll restoration, and fighting it produces the classic jumpy back-button. `scroll: false` suppresses this scroll exactly as it suppresses fragment scrolls (D2: one switch, "this navigation does not move the viewport").
_Alternative considered:_ smooth top-scroll — rejected: watching the page fly up on every pagination click reads as motion for its own sake, and native navigations don't animate.

### D2c — The deferred fragment scroll gates on `settled()` (added 2026-08-31)

`consumePendingFragment` currently queues one microtask after the first routed render — which predates data-driven anchors: a page whose headings render after a tracked fetch (the docs site) has no target when the attempt fires, so the documented single-attempt no-op swallows every initial-load and cross-page hash (fresh loads only worked when a warm cache won the race). The signal that means "tracked async content has landed" already exists: `settled()` — the same gate `renderToString` and `hydrate` use. The pending-fragment consumption becomes its third consumer: still a single attempt, still a silent no-op on a missing target, fired once settlement resolves (bounded like the other consumers, so an unsettled page can't hold the scroll hostage). Async work outside the tracking boundary keeps today's contract — the app owns its scroll from there.
_Alternative considered:_ an app-level "scroll when content lands" hook — rejected: every data-driven consumer would re-write it, and core already owns both the pending fragment and the settlement signal (general-product rule: build the primitive where the state lives).

### D3 — Thread the option, don't widen `scrollToFragment`

`route()` decides; `scrollToFragment` and `consumePendingFragment` stay unaware of options. The deferred path needs nothing new: not setting `pendingFragment` is the suppression. Keeps the SRP split the router audit established (`matchRoute`/`extractParams` helpers, orchestrating methods).

### D4 — TDD against the existing hash-navigation specs

New scenarios sit beside the current ones in `packages/core/tests/unit/hash-navigation.spec.ts` (same-page, bare `#`) and `hash-navigation-routed.spec.ts` (cross-page deferred) so the default-path assertions and the opt-out assertions share fixtures — the default scenarios double as the regression guard for "default unchanged".

## Risks / Trade-offs

- [A caller opts out and the target is off-screen] → documented as caller-owned: the option exists for "the user is already there" cases; the README paragraph says so.
- [Option name reads as "enable scrolling" globally] → the README lists it under `route`'s options with the fragment-only scope stated; it has no effect on navigations without a fragment (there is nothing to suppress).
- [`RouteLink` consumers want it] → out of scope by decision; the handler form is one line and `RouteLink` stays a thin, zero-config anchor.

## Migration Plan

Additive, minor release of `@loom-js/core`. No consumer changes required; the docs app adopts it in its heading anchor after release.

## Open Questions

None.
