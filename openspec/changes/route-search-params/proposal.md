# Route Search Params

## Why

`RouteValue` exposes `matchedRoute`, `params`, `pathname`, and `raw` — but reading the query string means every consumer hand-rolls `new URLSearchParams(routeValue.raw.search)` at each `routeEffect`/`watchRoute`/guard site (maintainer request, 2026-09-06). The platform already defines the ergonomic shape (`URL.searchParams`); the route value should match it.

## What Changes

- `RouteValue` gains a **`searchParams` getter** returning a `URLSearchParams` built from the route's location — lazy (nothing constructed unless read) and fresh per access (no instance shared between consumers, so one caller's mutation can never leak into another's read).
- Available everywhere `RouteValue` flows: `routeEffect`, `watchRoute`, route `guard`, and page `routeProps`.
- README routing API bullet + routing topic updated per the propagation requirement.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spa-routing`: the route-value surface gains the `searchParams` requirement (lazy, fresh per access, consistent with `raw.search`).

## Impact

- `packages/core/src/router.ts` (`getRouteValue`) + `types.ts` (`RouteValue`).
- `packages/core/tests/unit` — getter laziness/freshness/content specs alongside the route suites.
- README + `topics/08-routing.md`; **minor** `@loom-js/core` changeset.
- Tiny and independent; no sequencing constraints.
