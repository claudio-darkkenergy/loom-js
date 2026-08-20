---
'@loom-js/core': minor
---

Docs-readiness: hash/anchor navigation & zero-value attributes.

**Hash / anchor navigation** — `route()` now restores the native anchor jump its `preventDefault` suppresses. Same-page `#fragment` navigations scroll the matching `id` into view immediately (a bare `#` scrolls to the top) without waking the location/route activities; fragment-carrying navigations that change the route — including the initial page load, whose native scroll fires before lazily-imported content exists — scroll after the routed content renders. The deferred scroll is a single attempt (a missing target no-ops; the next navigation drops an unconsumed fragment), and `scrollIntoView()` leaves smoothness to the page's `scroll-behavior` CSS. Off-browser (server renders), the scroll paths are inert.

**Zero-value attributes** — the falsy-removal rule for interpolated attribute values now exempts the number `0` in every attribute-setting path (attr slots, `$attrs` entries, `$`-prefixed passthroughs), matching the text path's existing zero-preservation. `tabindex=${0}` / `min=${0}` render `"0"`, and `value=${0}` sets the value property. Behavior change: `value={0}`-style bindings previously removed the attribute — `false`/`null`/`undefined`/`''` remain the removal idiom.
