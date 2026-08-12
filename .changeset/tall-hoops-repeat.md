---
'@loom-js/core': minor
---

Reactive subscriptions are now disposable: `reactiveEffect` returns an `Unsubscriber` that permanently stops the effect and removes it from every dependency set (idempotent, safe to call mid-trigger), `activity(...).watch` returns that unsubscriber, and `watchRoute` finally honors its documented unsubscriber contract. `activity.effect` render subscriptions are unchanged (context-managed); automatic unmount-driven teardown is a planned follow-up.
