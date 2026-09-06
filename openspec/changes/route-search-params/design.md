# Design — route-search-params

## Context

`getRouteValue(location)` assembles the plain `RouteValue` per emission; consumers destructure it in effects, watchers, and guards. The query string rides `raw.search` only.

## Goals / Non-Goals

**Goals:** platform-parity query access on the route value; zero cost when unread.

**Non-Goals:** query-driven route matching or emissions (a search-only change stays a location-layer concern, unchanged); writable/reactive search params (reading surface only — navigation still goes through `route()`); adding the getter to the raw location layer (`Location` is the platform's object; `location.search` already exists there).

## Decisions

### D1 — `searchParams`, a getter, fresh per access

Named for `URL.searchParams` parity. Defined as a getter on the route value (defineProperty in `getRouteValue`) so nothing is constructed unless read (maintainer's requirement). Each access returns a _new_ `URLSearchParams(raw.search)`: memoizing would hand every consumer of an emission the same mutable instance — one effect's `.set()` would silently corrupt a guard's read. Freshness makes mutation harmless (the copy is detached; the URL is unaffected) at negligible construction cost; consumers wanting reuse hold their own reference.

### D2 — Docs placement

The `routeEffect` bullet's RouteValue enumeration gains `searchParams`; the guard's `RouteValue` mention inherits it; one usage line in the routing topic (`routeValue.searchParams.get('tab')`).

## Risks / Trade-offs

- [Repeated access re-parses] → intended trade for mutation safety; parsing a search string is trivially cheap, and heavy readers keep a local reference.

## Migration Plan

Additive minor. No consumer changes.

## Open Questions

None.
