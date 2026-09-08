---
'@loom-js/core': minor
---

The router now owns the full navigation-scroll contract, with an opt-out. `route(event, options)` accepts `scroll?: boolean` (default `true`): `{ scroll: false }` keeps the viewport still — no same-page fragment scroll, no deferred cross-page fragment scroll, no bare-`#` top scroll — while history, the quiet pipeline & the activation policy behave exactly as before. Fragmentless route-changing navigations now scroll to the top after the new page renders (instantly, bypassing `scroll-behavior` CSS; `popstate` traversal stays with the browser's own scroll restoration), and the deferred fragment scroll now fires once the settlement signal resolves (bounded) instead of a post-render microtask — so anchors produced by tracked async work (lazy route chunks, data fetched through activity transforms) exist when the single attempt fires.
