---
'@loom-js/core': patch
---

`hydrate` on an empty root (no pre-rendered children) now mounts immediately and renders progressively, as `init` would. The settle-gated swap exists to keep served markup visible until takeover — on an empty root it only held a blank screen for the whole settle wait where the app's loading state should have painted (dev servers and SPA-fallback shells hit this).
