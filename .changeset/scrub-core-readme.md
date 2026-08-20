---
'@loom-js/core': patch
---

README scrub: document the full `activity` signature (transforms as the async-data path, `deep`/`force` options, complete return shape), all five life-cycle hooks with timing, the complete `init` props, and previously missing coverage for `simple`, `lazyImport`, and the boot config surface (`globalConfig`, `appendEvents`). Replace the retired `PrerenderSsgWebpackPlugin` example with the `renderToString` SSG idiom, and fix every broken code example — all examples now type-check against the package.
