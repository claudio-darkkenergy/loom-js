---
'@loom-js/build': minor
---

New `devtools` config key: `'dev'` (default) | `'lazy'` | `false`. Where devtools applies to the build's mode, the tool names every top-level `component` / `defineElement` declaration after its binding and registers a lazy `@loom-js/devtools` loader ahead of the entry's imports, so devtools code loads only when `loom.devtools.enable()` runs. The default skips both when the package isn't installed; an explicit setting without it fails the build.
