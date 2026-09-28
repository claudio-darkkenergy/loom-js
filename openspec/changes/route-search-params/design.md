# Design — route-search-params

## Context

`getRouteValue(location)` assembles the plain `RouteValue` per emission; consumers destructure it in effects, watchers, and guards. The query string rides `raw.search` only.

## Goals / Non-Goals

**Goals:** platform-parity query access on the route value; zero cost when unread.

**Non-Goals:** query-driven route matching or emissions (a search-only change stays a location-layer concern, unchanged); writable/reactive search params (reading surface only — navigation still goes through `route()`); adding the getter to the raw location layer (`Location` is the platform's object; `location.search` already exists there).

## Decisions

### D1 — `searchParams`, a getter, fresh per access

Named for `URL.searchParams` parity. Defined as a getter on the route value so nothing is constructed unless read (maintainer's requirement). The route value is a class instance (`RouteSnapshot` in `router.ts`, prototype getter) rather than a plain object with a `defineProperty` accessor: the activity value store copies plain objects with `Object.assign`, which runs an enumerable getter on every emission (one construction per navigation, read or not) and skips a non-enumerable one (the initial, unmatched route value loses `searchParams`). The store passes non-plain objects through untouched. Cost: a spread or `Object.assign` copy of the route value omits `searchParams`. Each access returns a _new_ `URLSearchParams(raw.search)`: memoizing would hand every consumer of an emission the same mutable instance — one effect's `.set()` would silently corrupt a guard's read. Freshness makes mutation harmless (the copy is detached; the URL is unaffected) at negligible construction cost; consumers wanting reuse hold their own reference.

### D2 — Docs placement

In the routing topic, the `routeEffect` and guard entries' `RouteValue` enumerations gain `searchParams`, and the `routeProps` list gains an entry with the usage line (`routeValue.searchParams.get('tab')`). The README carries no API reference since `readme-slim-down`, so it is not edited; the content map's routing entry lists the new specs.

### D3 — `sanitizeLocation` leaves the public surface

The export was marked for removal by its own doc comment from day one and slipped it; it also sits outside `core-readme-accuracy`'s export coverage (neither documented nor recorded as excluded). Un-export it, keep it internal, drop the now-moot line from its comment. A clean break: no alias, no transition window, no migration guidance — the changeset states the removal as breaking.

## Risks / Trade-offs

- [Repeated access re-parses] → intended trade for mutation safety; parsing a search string is trivially cheap, and heavy readers keep a local reference.

## Migration Plan

Minor core release: `searchParams` is additive; the `sanitizeLocation` un-export is breaking and stated as such in the changeset.

## Open Questions

None.
