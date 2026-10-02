---
'@loom-js/build': minor
---

The loom build tool. `loom build`, `loom dev` and `loom prerender` read a `loom.config.ts` (`defineConfig`, object or `({ mode }) => config`) and run the esbuild assembly, one HTML shell per route through `@loom-js/esbuild-plugin-html-split`, static copies, and a prerender phase driven by app hooks (`setup`, `routes`, `validate`, `after`) that writes rendered HTML plus dehydrated state per route. Mode decides minification, sourcemaps, route-scoped shells, two-pass CSS and `__DEV__`; `esbuild(options)` is the raw escape hatch. `build`, `dev`, `prerender`, `loadConfig`, `resolveConfig` and `createBuildOptions` are exported for scripted use.
