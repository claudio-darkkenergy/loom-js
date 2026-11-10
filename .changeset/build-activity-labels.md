---
'@loom-js/build': minor
---

Where devtools is available, the build also labels activities from their bindings: `const count = activity(0)` and `const open = own(() => activity(false))` are named `count` and `open` in devtools and diagnostics, at any nesting depth. An explicit `label` wins. `injectActivityLabels` is exported alongside `componentBindingsOf`.
