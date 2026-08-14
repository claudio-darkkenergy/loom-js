---
'@loom-js/pink': patch
---

Migrate off `@loom-js/core`'s removed deprecated aliases (`ComponentProps` → `ComponentOutputProps`) and convert all pass-through components to core's new `simple()` factory, which guarantees implementations a props object under the new conditional props typing (all-optional-props components now accept propless calls). `PinkTag` keeps its `.Tag` property via `Object.assign`. No behavior change for existing callers.
