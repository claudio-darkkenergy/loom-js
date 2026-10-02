---
'@loom-js/esbuild-plugin-html-split': minor
---

Published under the `@loom-js` scope as a compiled package (ES + CJS + typings, `esbuild` as a peer dependency) with a README covering the options, template args and chunk classification. `routeScopeOf` is exported — the route → chunk-prefix convention templates and the build tool share. Paths resolve against the build's `absWorkingDir`, so an `outdir` outside the project (or a process that changes directory after esbuild starts) emits correct URLs. Debug logging sits behind `verbose`; the unused `prerender` option is gone.
