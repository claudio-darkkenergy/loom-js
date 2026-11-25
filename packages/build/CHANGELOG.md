# @loom-js/build

## 0.5.0

### Minor Changes

- 8d9fc73: `loom dev` now serves the files your prerender hooks generate, such as a search index or `llms.txt`. Before, only a production build wrote them, so features that depend on them were broken in dev.
  
  **Breaking:** to make that possible, `prerender.after` is renamed to `prerender.artifacts({ bundle, outDir, mode })` and now runs in every command: after the routes in a production `loom build` and `loom prerender`, in a development `loom build`, and in `loom dev`. Rename the key in your config; there is no alias.
  
  `loom dev` loads the prerender bundle and runs `setup` and `artifacts` on start, after every successful rebuild and when you type `r` + Enter. The generated files are served at their production paths. Each run uses a fresh worker, so hooks always see current code and config. `loom dev --prerender` also renders every route, so prerendered pages and hydration can be tested with live reload. In dev a failing hook logs a `[loom dev]` warning and the server keeps serving; builds still fail.
  
  `dev()` now takes `{ prerender }` and returns `refresh()` and `stop()`. Pass `configFile` to `resolveConfig` so `dev()` can reload the config for each run.

## 0.4.0

### Minor Changes

- cbc2e1a: Where devtools is available, the build also labels activities from their bindings: `const count = activity(0)` and `const open = own(() => activity(false))` are named `count` and `open` in devtools and diagnostics, at any nesting depth. An explicit `label` wins. `injectActivityLabels` is exported alongside `componentBindingsOf`.

## 0.3.0

### Minor Changes

- be2c845: Add the `prerender.meta(route, output, bundle)` hook. It returns a prerendered route's own `title` and `description`, which the tool writes into that route's `<title>`, `og:title`, `<meta name="description">` and `og:description`.

## 0.2.0

### Minor Changes

- d4cb8bd: New `devtools` config key: `'dev'` (default) | `'lazy'` | `false`. Where devtools applies to the build's mode, the tool names every top-level `component` / `defineElement` declaration after its binding and registers a lazy `@loom-js/devtools` loader ahead of the entry's imports, so devtools code loads only when `loom.devtools.enable()` runs. The default skips both when the package isn't installed; an explicit setting without it fails the build.

## 0.1.0

### Minor Changes

- c0e32de: The loom build tool. `loom build`, `loom dev` and `loom prerender` read a `loom.config.ts` (`defineConfig`, object or `({ mode }) => config`) and run the esbuild assembly, one HTML shell per route through `@loom-js/esbuild-plugin-html-split`, static copies, and a prerender phase driven by app hooks (`setup`, `routes`, `validate`, `after`) that writes rendered HTML plus dehydrated state per route. Mode decides minification, sourcemaps, route-scoped shells, two-pass CSS and `__DEV__`; `esbuild(options)` is the raw escape hatch. `build`, `dev`, `prerender`, `loadConfig`, `resolveConfig` and `createBuildOptions` are exported for scripted use.

### Patch Changes

- Updated dependencies [c0e32de]
  - @loom-js/esbuild-plugin-html-split@0.1.0
