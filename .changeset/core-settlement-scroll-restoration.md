---
'@loom-js/core': minor
---

The router now owns scroll restoration (`history.scrollRestoration = 'manual'`): each entry's scroll offset is captured into its history state at exit (router navigations and pagehide), and replays after the settlement signal resolves on reload and back/forward traversal — so restoration is computed against fully-rendered content instead of the browser clamping against a still-loading document. A URL fragment outranks a saved offset; entries with no saved offset stay at the top. `route(event, { scroll: false })` and all other scroll semantics are unchanged.
