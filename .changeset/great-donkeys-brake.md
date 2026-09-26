---
'@loom-js/core': patch
---

`ContextFunction` detection no longer depends on the function's runtime name — `component()` marks the function explicitly, so templates render correctly under minifiers that rename functions (e.g. Vite production builds without `keepNames`). The name check remains as a fallback for values from older core copies.
