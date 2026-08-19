---
'@loom-js/core': minor
---

`renderToString` now gates on the settlement signal (`settled()`) instead of the markup-quiet polling drain, so framework-tracked async work — async activity transforms, route/page imports, `lazyImport` — serializes fully however many macrotasks it spans, with unbounded chain depth. The wait is bounded by a new `maxWait` option on `RenderToStringOptions` (default `4000`ms, `Infinity` to disable — symmetric with `hydrate`'s `maxWait`): on expiry the render serializes what has landed and warns with the pending count via the debug-gated framework console. Async work outside an activity transform is invisible to the signal, as documented for `hydrate`.
