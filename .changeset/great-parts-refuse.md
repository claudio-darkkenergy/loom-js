---
'@loom-js/core': minor
---

Automatic unmount teardown: when a component's DOM is genuinely detached, its `activity.effect` subscriptions are disposed and released from the activity's scoped actions (cascading through child contexts), so detached trees stop re-rendering and are no longer pinned in memory; torn-down contexts re-subscribe cleanly on remount. Behavior fix included: a component _moved_ within the DOM (e.g. an array reorder) no longer fires a spurious `onUnmounted` or silently loses its lifecycle registration — `onUnmounted` now fires only for genuine removals.
