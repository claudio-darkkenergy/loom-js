---
'@loom-js/core': minor
---

Reactive attribute bindings: `activity.bind(select?)` produces an `AttrBinding` usable as any template attribute value (standard attrs and `$attrs` entries) — the attribute applies the projected current value immediately and stays in sync with every activity update without re-rendering the component. Bindings are swap-safe across re-renders (at most one live subscription per attr slot) and are disposed automatically on unmount teardown. Also fixes a latent `$attrs` bug: a falsy entry value now removes the entry's own attribute instead of the literal `attrs` name.
