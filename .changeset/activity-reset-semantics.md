---
'@loom-js/core': patch
---

Documents a behavior change to `reset()` on transformed activities that shipped with the transform concurrency release: `reset()` no longer sends the initial value through the transform. It restores the initial value directly, under the same change comparison as any commit, and dispatches like any other run — under the default concurrency it retires an in-flight transform run, under `'ordered'` and `'serial'` it lands in turn. Untransformed activities are unaffected. If you relied on `reset()` re-running the transform, call `update(<initial input>)` instead.
