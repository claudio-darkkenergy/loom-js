---
'@loom-js/core': patch
---

Fix array-valued `activity()` reconciliation so effects no longer re-render (and DOM nodes no longer repaint) when an array update carries the same content.

- `resolveCurrentValue` now shallow-clones array values, so `value()` and the stored current value are reference-isolated and can't be mutated to defeat change detection.
- `shouldUpdate` gains an array branch gated on `deep`: with `{ deep: true }`, a same-content array update (new reference, equal elements in order) is treated as unchanged and does not re-run subscribed effects. `force` / `update(value, true)` still overrides.
- Array reconciliation now honors a falsy context `key` (`0`/`''`) instead of collapsing it to the index (`?? i`), enabling value-keyed reuse for consumers that pass a stable `key` (e.g. `.map((item) => Component({ key: item }))`). Reordering such a list reuses each item's existing DOM node instead of repainting by position.
- Removed leftover debug `console.log`s from `activity`, `component`, and the array text updater.

Known limitation (follow-up): numeric keys still collide with the index-based fallback keyspace during the outer interpolation's re-reconciliation; use string/stable keys for keyed reuse until that is addressed.
