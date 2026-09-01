# Route Scroll Option

> Amended 2026-08-31 (twice): scope widened from the fragment-scroll opt-out alone to the router's full navigation-scroll contract — fragmentless SPA navigations scroll to top by default (previously the viewport kept its old offset), and the deferred fragment scroll now gates on the settlement signal (previously a single microtask after the first routed render, which fires before data-driven anchors exist — observed as hash URLs not scrolling on the docs site).

## Why

`route()` always performs the native anchor jump its `preventDefault` suppresses — a same-page `#fragment` navigation scrolls the target into view unconditionally. For an in-page "copy link" anchor placed beside a heading, the user is already at the target; the scroll (and the top-of-viewport snap on small offsets) yanks the control out from under the pointer and makes the copied feedback (icon swap + tooltip) unreadable. Consumers currently have no way to keep the URL update while declining the scroll.

## What Changes

- **The deferred fragment scroll waits for settlement**: cross-page and initial-load fragment scrolls consume after `settled()` (bounded, `maxWait`-style) instead of one microtask after the first routed render — so anchors produced by tracked async work (route chunks, data fetched through activity transforms) exist when the single attempt fires. Same-page hash scrolls stay immediate.
- **Fragmentless route-changing navigations scroll to top** after the routed content renders — instantly (bypassing `scroll-behavior` CSS; page-to-page shouldn't animate), fixing the SPA gap where a navigation from a scrolled position rendered the next page at the old offset. Same-page hash navigation and history traversal (`popstate` — the browser's own scroll restoration owns it) are unaffected.
- `OnRouteOptions` gains `scroll?: boolean` (default `true`), now covering _every_ scroll the navigation would perform: fragment scrolls and the new top scroll alike. With `scroll: false`, `route(event, options)` still updates history (`pushState`/`replaceState`), keeps the location/route layers quiet for a same-page fragment, and applies the native-intent fallthrough policy unchanged — but performs no fragment scroll: not the same-page immediate scroll, not the cross-page deferred scroll, and not the bare-`#` scroll-to-top.
- `redirect(href)` is unaffected (it takes no options).
- README routing section documents the option in `route`'s options list and in the hash/anchor navigation paragraph.
- Non-breaking: the default preserves today's behavior exactly.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spa-routing`: the "Hash navigations scroll to their anchor target" requirement gains an explicit opt-out and re-times the deferred scroll to settlement, and a new requirement pins the fragmentless contract — route-changing navigations land at the top by default, `popstate` defers to browser restoration, `scroll: false` suppresses both.

## Impact

- `packages/core/src/router.ts` — thread the option from `route()` into the same-page scroll and the deferred `pendingFragment` path.
- `packages/core/src/types.ts` — `OnRouteOptions.scroll`.
- `packages/core/README.md` — `route` options + hash navigation paragraph (per `core-readme-accuracy`).
- `packages/core/tests/unit/hash-navigation*.spec.ts` — new scenarios for the opt-out.
- Published: `@loom-js/core` **minor** changeset.
- First consumer (out of scope here): the docs app's heading link-copy anchor, which lands with the in-flight pink/app work once this ships.
