# @loom-js/build

## 0.2.0

### Minor Changes

- d4cb8bd: New `devtools` config key: `'dev'` (default) | `'lazy'` | `false`. Where devtools applies to the build's mode, the tool names every top-level `component` / `defineElement` declaration after its binding and registers a lazy `@loom-js/devtools` loader ahead of the entry's imports, so devtools code loads only when `loom.devtools.enable()` runs. The default skips both when the package isn't installed; an explicit setting without it fails the build.

## 0.1.0

### Minor Changes

- c0e32de: The loom build tool. `loom build`, `loom dev` and `loom prerender` read a `loom.config.ts` (`defineConfig`, object or `({ mode }) => config`) and run the esbuild assembly, one HTML shell per route through `@loom-js/esbuild-plugin-html-split`, static copies, and a prerender phase driven by app hooks (`setup`, `routes`, `validate`, `after`) that writes rendered HTML plus dehydrated state per route. Mode decides minification, sourcemaps, route-scoped shells, two-pass CSS and `__DEV__`; `esbuild(options)` is the raw escape hatch. `build`, `dev`, `prerender`, `loadConfig`, `resolveConfig` and `createBuildOptions` are exported for scripted use.

### Patch Changes

- Updated dependencies [c0e32de]
  - @loom-js/esbuild-plugin-html-split@0.1.0
