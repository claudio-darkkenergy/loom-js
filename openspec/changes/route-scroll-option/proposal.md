# Route Scroll Option

## Why

`route()` always performs the native anchor jump its `preventDefault` suppresses — a same-page `#fragment` navigation scrolls the target into view unconditionally. For an in-page "copy link" anchor placed beside a heading, the user is already at the target; the scroll (and the top-of-viewport snap on small offsets) yanks the control out from under the pointer and makes the copied feedback (icon swap + tooltip) unreadable. Consumers currently have no way to keep the URL update while declining the scroll.

## What Changes

- `OnRouteOptions` gains `scroll?: boolean` (default `true`). With `scroll: false`, `route(event, options)` still updates history (`pushState`/`replaceState`), keeps the location/route layers quiet for a same-page fragment, and applies the native-intent fallthrough policy unchanged — but performs no fragment scroll: not the same-page immediate scroll, not the cross-page deferred scroll, and not the bare-`#` scroll-to-top.
- `redirect(href)` is unaffected (it takes no options).
- README routing section documents the option in `route`'s options list and in the hash/anchor navigation paragraph.
- Non-breaking: the default preserves today's behavior exactly.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spa-routing`: the "Hash navigations scroll to their anchor target" requirement gains an explicit opt-out — the scroll is the default, not an invariant; `scroll: false` suppresses it while every other hash-navigation guarantee (URL update, quiet pipeline, fallthrough policy) holds.

## Impact

- `packages/core/src/router.ts` — thread the option from `route()` into the same-page scroll and the deferred `pendingFragment` path.
- `packages/core/src/types.ts` — `OnRouteOptions.scroll`.
- `packages/core/README.md` — `route` options + hash navigation paragraph (per `core-readme-accuracy`).
- `packages/core/tests/unit/hash-navigation*.spec.ts` — new scenarios for the opt-out.
- Published: `@loom-js/core` **minor** changeset.
- First consumer (out of scope here): the docs app's heading link-copy anchor, which lands with the in-flight pink/app work once this ships.
