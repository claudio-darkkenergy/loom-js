---
'@loom-js/core': patch
---

A fragment-rooted component now keeps its top-level nodes current after it renders. Before, a top-level effect swap, a top-level list growing or shrinking, or a nested fragment changing left `node()`, `onRendered` and later re-renders holding the first render's nodes. That could misplace content or throw `insertBefore` errors. A keyed list that grows inside a parent's re-render no longer throws either.
