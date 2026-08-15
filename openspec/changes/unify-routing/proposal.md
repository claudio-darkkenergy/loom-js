## Why

`@loom-js/core` ships two parallel routing systems that don't see each other. `routing.ts` (deprecated) is a raw pub/sub over `Location`; `router.ts` is the route-matching `Router`. Each owns its own activity and registers its own `popstate` listener, and `didRouteChange` is duplicated in both. Three concrete problems fall out of this:

1. **The deprecated module still carries a unique capability.** `Router.transform` early-returns without a `routesConfig` (`router.ts:154`), so `routeEffect`/`watchRoute` never emit unless `createRoutes()` ran first. The deprecated `router()` is currently the only zero-config way to react to raw `Location` — which is why core's own server tests and the README still lean on it. The old API can't be retired until the new system absorbs that capability.
2. **Real apps still can't SSR.** `apps/loom` calls `createRoutes()` at module scope (`routes.ts:7`), which eagerly constructs the Router, which reads `getWindow().location` at import time — before any render scope exists. Verified off-browser: the import throws. `add-server-rendering` made core import-safe, but the router's eager construction pushes the same crash up into app code.
3. **The Router is a process-wide singleton**, which is exactly the per-request isolation liability the `add-server-rendering` design deferred as a follow-up: a server process reuses one Router (and its subscriptions and captured location) across renders.

## What Changes

- **Layer the routing pipeline inside `Router`.** One history source per router instance feeds a raw **location activity** (always fires, no route table needed — preserving the old activity's `force` semantics), whose match transform feeds the existing **route activity** (`RouteValue`). The zero-config gap disappears structurally; one `popstate` listener; one `didRouteChange`.
- **New public layer-1 API:** `locationEffect(cb)` (effect over raw `Location`, returns renderable — the blessed replacement for deprecated `router()`) and `watchLocation(cb)` (watcher — replacement for `onRouteUpdate`). Named symmetrically with layer-2's `routeEffect`/`watchRoute`.
- **Window-keyed router instances.** The router registry becomes a `WeakMap` keyed by the provider window (`getWindow()` from `lib/dom.ts`): in a browser there is one window forever, so one router — the singleton emerges rather than being enforced; on the server each injected window gets its own router, giving per-render isolation for free, garbage-collected with the window.
- **`createRoutes` becomes DOM-free at call time.** It stays the app-facing API (it returns the routes component composed into the layout tree — a component-position concern `init` shouldn't own). It captures the route table into a module-level store without touching the DOM; activity wiring and the `popstate` hook defer to first use inside a DOM scope. Module-scope `createRoutes` becomes legal everywhere — fixing the SSR import crash (arguably a bug fix). A second `createRoutes` call replaces the table (today's behavior, now documented).
- **`routing.ts` becomes a pure delegating bridge**, observably identical: `router` → `locationEffect`, `onRoute` → `route`, `onRouteUpdate` → `watchLocation`, each carrying a `@deprecated` JSDoc with its migration. Internal consumers (core specs, server tests, README) migrate to the new names; the README Routing section — which today documents _only_ the deprecated API — is rewritten around `createRoutes`/`route`/`routeEffect` + the new layer-1 API.
- **Deliberately NOT in this change:**
    - **Deleting `routing.ts`** — the bridge ships for one release with deprecation notices; deletion is a trivial follow-up once consumers have a migration window.
    - **File-derived route config** (build-time folder traversal feeding `createRoutes`, `htmlSplit`, and the SSG page list) — the designed successor change (`file-based-routes`); it consumes this change's stabilized `createRoutes` shape.
    - **Hydration** — unchanged, still future.

## Capabilities

### Modified Capabilities

- `spa-routing`: widened beyond link-activation policy (its deliberately narrow first scope) to cover the unified pipeline: zero-config location reactivity, single history pipeline per window, window-scoped router instances, and DOM-free route registration.
- `server-rendering`: gains route-aware rendering — a `createRoutes`-based app renders the route matched from `renderToString`'s `url`, and route-table apps import safely off-browser.

## Impact

- **Code:** `packages/core/src/router.ts` (layering, registry, DOM-free capture), `routing.ts` (delegations), `index.ts` (new exports), `elements/route-link.ts` (unchanged behavior, same `route`), core tests (`routing.spec.ts` retained as bridge-parity guard; `lazy-import.spec.ts` + `tests/support/components/router.ts` migrate; new layer-1/isolation specs), server tests migrate off deprecated `router`, `packages/core/README.md` Routing section rewrite, `.claude/skills/skill-config.md` routing conventions.
- **Risk:** behavioral parity of the layered activities with today's subtle semantics — the old activity's `force: true` (fires effects on every update), `didRouteChange`'s origin/pathname/search-only comparison, and `pageRouteEffect`'s same-path skip. The bridge is spec'd as **observably identical**; the existing `routing.spec` and `route-activation` suites must pass unchanged as the parity guard.
- **Release:** `@loom-js/core` minor — additive API (`locationEffect`, `watchLocation`), deprecation notices, and the module-scope-`createRoutes` SSR fix.
- **Depends on / relates to:** builds directly on `add-server-rendering`'s provider seam (window-keyed registry) — archived 2026-08-15. Successor: `file-based-routes`.

## Resolved Questions

1. **Layer-1 API is public**, named `locationEffect`/`watchLocation` — "react to location without a route table" kept proving to be a legitimate need (server tests, README examples).
2. **`createRoutes` remains the app-facing registration** — `init({ routes })` was rejected: `init` has no business knowing where in the component tree routes render, and two entry points to one route table is how the codebase got two routing systems in the first place.
3. **Router identity = provider window** (`WeakMap<DomWindow, Router>`) — reuses the `add-server-rendering` seam rather than inventing provisioning machinery; browser singleton emerges, server isolation is free.
4. **Route table is app-global** (module-level store read by every per-window router); a repeat `createRoutes` call replaces it, matching current behavior.
5. **`routing.ts` deletion is deferred** one release; this change ships the bridge + migrations so deletion becomes a one-liner.
