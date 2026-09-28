---
'@loom-js/core': minor
---

`RouteValue` has a `searchParams` getter that returns the location's query as a `URLSearchParams`. It is available in `routeEffect`, `watchRoute`, the route `guard`, and a page's `routeProps`: `routeValue.searchParams.get('tab')`. Nothing is built until it is read, and each read returns a new instance, so changing one does not affect other readers or the URL.

The route value is now a class instance, not a plain object. Reading and destructuring its fields work as before; copying it with spread or `Object.assign` leaves `searchParams` out.

**Breaking:** `sanitizeLocation` is no longer exported.
