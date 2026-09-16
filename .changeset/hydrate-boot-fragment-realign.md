---
'@loom-js/core': patch
---

`hydrate` now realigns a boot URL fragment after the atomic swap. Previously the fragment scroll targeted the pre-swap server DOM (the router's boot-owed scroll, or the browser's native jump) and the swap's reflow stranded the position — on reloads, `scrollRestoration: 'manual'` means the browser performs no fragment scroll at all, so a prerendered page could land misaligned or unscrolled.
