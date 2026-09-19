---
'@loom-js/core': minor
---

`createRoutes` accepts an optional `assets` map — stylesheet URLs keyed by route pattern, loaded concurrently with the route's chunk import and settled before the route renders. Already-linked URLs count as loaded, failures log on the debug lane and never block navigation, and server renders skip asset loading. Omitting `assets` changes nothing.
