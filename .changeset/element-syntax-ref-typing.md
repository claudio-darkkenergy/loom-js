---
'@loom-js/core': patch
---

`TemplateTagValue` now admits a `RefContext`, so `ref=${createRef()}` on a component element type-checks — the transform always passed it through at runtime; only the interpolation type rejected it. Surfaced by `document-component-refs`'s extract-and-compile pass over the new README Refs example.
