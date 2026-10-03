---
'@loom-js/core': patch
---

Rendering a component instance is cheaper: dynamic paths update through a plain per-instance updater list diffed on re-render instead of one reactive effect per slot, life-cycle events dispatch directly instead of through a reactive proxy per instance, the mount/unmount scan uses one native element collection per mutated node, and per-instance collections are created on first use. Same behavior; 1 000 bench rows render in about 35 % less time and hold about half the heap.
