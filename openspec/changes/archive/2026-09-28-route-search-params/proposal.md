# Route Search Params

## Why

`RouteValue` exposes `matchedRoute`, `params`, `pathname`, and `raw` — but reading the query string means every consumer hand-rolls `new URLSearchParams(routeValue.raw.search)` at each `routeEffect`/`watchRoute`/guard site (maintainer request, 2026-09-06). The platform already defines the ergonomic shape (`URL.searchParams`); the route value should match it.

## What Changes

- `RouteValue` gains a **`searchParams` getter** returning a `URLSearchParams` built from the route's location — lazy (nothing constructed unless read) and fresh per access (no instance shared between consumers, so one caller's mutation can never leak into another's read).
- Available everywhere `RouteValue` flows: `routeEffect`, `watchRoute`, route `guard`, and page `routeProps`.
- Routing topic updated per the propagation requirement (the slim README carries no API reference).
- **`sanitizeLocation` stops being exported** — its own doc comment has deprecated the export since it landed ("will be removed as an export"); it stays as the router's internal pathname-normalization helper. No in-repo consumer imports it; the changeset notes the removal (pre-1.0 minor per convention).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spa-routing`: the route-value surface gains the `searchParams` requirement (lazy, fresh per access, consistent with `raw.search`).

## Impact

- `packages/core/src/router.ts` (`getRouteValue`; `sanitizeLocation` un-exported) + `types.ts` (`RouteValue`).
- `packages/core/tests/unit` — getter laziness/freshness/content specs alongside the route suites.
- `topics/08-routing.md` + the content map's routing pointers; **minor** `@loom-js/core` changeset.
- Tiny and independent; no sequencing constraints.
