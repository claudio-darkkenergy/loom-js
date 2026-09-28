# Tasks — route-search-params

## 1. TDD

- [x] 1.1 Red: route-value specs — `searchParams` content after query-carrying navigation (effect + guard sites), fresh-per-access isolation, laziness (constructor spy)
- [x] 1.2 Green: getter in `getRouteValue` + `RouteValue` type; un-export `sanitizeLocation` (D3: internal helper, removal line dropped from its comment; confirm no dist/type surface leak remains); suite + type-checks green

## 2. Docs & release

- [x] 2.1 Routing topic: `searchParams` in the guard, `routeEffect` and `routeProps` entries, with the usage line (D2); content map test pointers; draft re-push
- [x] 2.2 **Minor** changeset — additions plus the `sanitizeLocation` export removal, stated as breaking (no migration guidance)
