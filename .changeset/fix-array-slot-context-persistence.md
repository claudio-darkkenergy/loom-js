---
'@loom-js/core': patch
---

Fix array-valued slot reconciliation: `appendChildContext` now returns a persistent child context for array values (kept under a derived `` `${key}[]` `` keyspace so it can never collide with a component context at the same slot key). Re-reconciling an array slot now reuses each item's live context, DOM node, and activity subscription instead of rebuilding from a throwaway context — fixing duplicated subtrees and accumulating `activity.effect` subscriptions when an effect re-renders a component with array `children` (e.g. the docs TOC toggle duplicating the whole docs container).
