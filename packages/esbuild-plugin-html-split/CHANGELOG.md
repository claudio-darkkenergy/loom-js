# @loom-js/esbuild-plugin-html-split

## 0.1.0

### Minor Changes

- c0e32de: Published under the `@loom-js` scope as a compiled package (ES + CJS + typings, `esbuild` as a peer dependency) with a README covering the options, template args and chunk classification. `routeScopeOf` is exported — the route → chunk-prefix convention templates and the build tool share. Paths resolve against the build's `absWorkingDir`, so an `outdir` outside the project (or a process that changes directory after esbuild starts) emits correct URLs. Debug logging sits behind `verbose`; the unused `prerender` option is gone.

## 0.0.5

### Patch Changes

- 6d1ca83: Widen the `esbuild` dependency range to `^0.28.1`.

## 0.0.4

### Patch Changes

- 1203343: Created esbuild-plugin-html-split - generates an html file for each js entry or route.
