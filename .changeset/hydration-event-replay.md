---
'@loom-js/core': minor
---

`hydrate` gains opt-in event replay: `replayEvents?: boolean | string[]` (`true` = `['click', 'submit']`; an array names event types explicitly; off by default).

- While enabled, hydration attaches one capturing listener per replayed type on the root for the settle window. Recorded interactions have their native action cancelled — except clicks with an enclosing `href`-bearing anchor, which pass through (and are never replayed) so native navigation keeps degrading gracefully.
- After the swap and the `onMounted` sweep — before `onAppMounted` — recorded events re-dispatch in FIFO order to the structurally corresponding client nodes, as real constructed events with `isTrusted: false`. A target path that no longer resolves (e.g. after a `maxWait`-expired swap) drops that event with a console warning instead of mis-targeting.
- Listeners and the queue are released at the swap (and on `hydrate`'s failure path); the queue is capped at 50 with drop-oldest warnings. Off by default means zero behavior change, and `init`-only bundles still tree-shake all of it out.
