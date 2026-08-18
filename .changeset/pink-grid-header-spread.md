---
'@loom-js/pink': patch
---

`PinkGridHeader` forwards its header props to `Header` via the new spread form (`...${{ attrs, id, on, style }}`) instead of enumerating them. No behavior change — the rendered DOM is byte-identical — but this release requires a `@loom-js/core` with spread-prop support.
