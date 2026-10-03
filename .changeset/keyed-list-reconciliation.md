---
'@loom-js/core': minor
---

Keyed lists reconcile with a key index and minimal moves: a swap moves two nodes, a removal moves none, an append inserts only the new items, and a key that leaves releases its child context. A component context function carries its `key` as a property, so the reconciler reads keys without rendering. A mounted component re-invoked with unchanged props (shallow-equal, `children` by reference) keeps its rendering — a parent's re-render alone no longer re-runs a child's template; its own activities still drive their effects. Attribute bindings skip the DOM write when the projected value is unchanged. Fix: context functions are detected by their kind marker everywhere, so a minified build without `keepNames` reuses keyed items like any other build.
