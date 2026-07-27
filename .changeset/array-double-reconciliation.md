---
'@loom-js/core': patch
---

Fix keyed array reconciliation for numeric keys by making child-context cleanup non-destructive during the outer interpolation's re-reconciliation pass.

An array driven by `activity.effect(...)` is reconciled twice into the same `parentCtx.children` map: first by the effect's own render (with the item **context functions**, keyed by each item's `key`), then again by the surrounding `${...}` interpolation (with the **already-resolved DOM nodes**, which carry no key and therefore fall back to the index keyspace). The second pass took `appendChildContext`'s non-`ContextFunction` branch and ran `children.delete(key)`, wiping the child context of any keyed item whose `key` equalled an index — so numeric keys (`1`, `2`, …) lost their context and their nodes were recreated on the next reorder.

- `appendChildContext` now skips the cleanup delete when the reconciled value is a DOM `Node`. Legitimate component→text/primitive cleanup is preserved.
- The public `key` prop is widened from `string` to `number | string`, matching the `children` map's existing `Map<number | string, …>` keyspace.

This resolves the numeric-key limitation documented in the previous array-reconciliation release; numeric and string keys now both reuse their DOM node across a reorder.
