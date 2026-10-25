---
'@loom-js/core': minor
---

Devtools support. `component(fn, { name })` sets a component's display name (the loom build tool injects names automatically; an explicit `name` wins). The `loom` console global gains `loom.devtools.enable() / disable() / open('dock' | 'popup')`, which loads the registered devtools implementation on demand. A new `@loom-js/core/devtools` entry exposes the introspection surface (`registerDevtools`, the console-API records, the app-root tree walk, element-to-component lookup, activity discovery and the render hook) that `@loom-js/devtools` drives. With devtools off, render paths add only a null check.
