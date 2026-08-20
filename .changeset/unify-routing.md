---
'@loom-js/core': minor
---

Unified routing: the two parallel routing systems (deprecated `routing.ts` pub/sub and the route-matching router) are now one layered pipeline per window — a raw location activity (always fires) whose match transform feeds the route activity — with a single history listener per router instance.

**New API — layer 1 goes public**: `locationEffect(cb)` (effect over the raw `Location`, zero-config — no route table needed) and `watchLocation(handler)` (the watcher form, returns an unsubscriber). Named symmetric with layer 2's `routeEffect`/`watchRoute`.

**Removed (breaking, pre-1.0)**: the legacy `routing.ts` module is gone without a deprecation window. Migrate `router(cb)` → `locationEffect(cb)`, `onRoute(e, opts)` → `route(e, opts)` (which additionally leaves modified clicks and already-consumed events to the browser), and `onRouteUpdate(handler)` → `watchLocation(handler)`.

**SSR fixes**: `createRoutes` is now DOM-free at call time — calling it at module scope (the normal app shape) no longer crashes off-browser imports; it captures the route table into an app-global store (a repeat call replaces the table — last call wins) and history wiring defers to first use inside a DOM scope. Router instances are keyed by the provider window (`WeakMap`): the browser keeps exactly one router for the page's lifetime, while each server render's injected window resolves its own isolated instance, garbage-collected with the window.

**New server entry export**: `renderToString(app, { window, url })` — the async, go-to server render. It renders through the same path as the synchronous primitive, drains settled route/lazy-import work (`createRoutes` route pages, `lazyImport`) until the markup is quiet, and resolves with the page content serialized; concurrent calls are safely serialized internally. The synchronous primitive is exported as `renderToStringSync` (Node's `readFile`/`readFileSync` naming convention: the unmarked name belongs to the recommended path) — it serializes only what settled synchronously, which for a route-table app is the shell/fallback.
