## Context

Two parallel routing systems, blind to each other:

```
 TODAY
   popstate ──► historyApiActivity ──► router(cb) effects          (routing.ts, deprecated)
   popstate ──► routeActivity ─(transform: needs routesConfig!)──► routeEffect/watchRoute
        ▲                                                          (router.ts)
        └── two listeners, two didRouteChange copies, two truths
```

Verified drivers (2026-08-15):

- `Router.transform` early-returns without `routesConfig` → `routeEffect`/`watchRoute` are dead until `createRoutes()` runs; deprecated `router()` is the only zero-config location subscription.
- `createRoutes()` at module scope (the real `apps/loom` pattern, `routes.ts:7`) throws off-browser at import time — Router's constructor reads `getWindow().location` eagerly. Confirmed empirically against `dist`.
- App/lib code uses only `router.ts` exports; `routing.ts` is consumed by core's own tests, the README (which documents _only_ the deprecated API), and the server tests written during `add-server-rendering`.

## Decisions

### D1: One pipeline, two subscription altitudes

```
   popstate / route() / pushState
              │
              ▼
   ┌─────────────────────┐   raw Location, always fires (old activity's
   │  location activity  │◄──  force semantics), zero-config —
   └─────────┬───────────┘   what deprecated router() was
             │ match transform (needs the route table)
             ▼
   ┌─────────────────────┐   RouteValue: matchedRoute, params,
   │   route activity    │◄──  pathname — what routeEffect /
   └─────────────────────┘   watchRoute serve
```

Both activities live inside the `Router` instance. Exactly one history listener per instance, wired when the instance wires (see D3). `didRouteChange` exists once. The transform preserves today's semantics: match against the captured table, skip unmatched/invalid, same-path skip stays in `pageRouteEffect`.

### D2: Router identity = provider window

```
   getRouter()  =  routerRegistry.get(getWindow())  ??  create-and-register

   Browser:  one window, forever      →  one router (singleton, emergent)
   Server:   fresh window per render  →  fresh router per render (isolation, free)
             window garbage-collected →  its router goes with it (WeakMap)
```

`routerRegistry: WeakMap<DomWindow, Router>`. Reuses the `add-server-rendering` seam — no new provisioning machinery, no exported class, no way to construct a second router for the same window. Every module-level API (`route`, `routeEffect`, `watchRoute`, `redirect`, `createRoutes`'s returned component, `locationEffect`, `watchLocation`) resolves through `getRouter()` at call/effect time, so the same app code binds to the right instance in either environment. Multi-`init` pages share the window's router by definition (rule: one router per window).

### D3: `createRoutes` captures DOM-free; wiring is deferred

`createRoutes({ config, fallback })` writes the table + fallback to a **module-level store** (app-global — the route table is not per-window state) and returns the routes component. It touches no DOM. Each `Router` instance reads the store and wires its activities + `popstate` listener lazily, on first DOM-scoped use (first effect/watch/route call inside a browser or `withWindow` scope). Consequences:

- Module-scope `createRoutes` is legal everywhere — the SSR import crash is fixed.
- A per-window router constructed _after_ the table was captured matches immediately (the server case: capture at import, construct at render).
- Repeat `createRoutes` replaces the table (today's last-call-wins, now documented); already-constructed routers observe the store on next transform rather than caching the table.

Rejected: `init({ routes })` — `init` shouldn't know where in the tree routes render, and a second registration entry point recreates the two-systems problem.

### D4: Layer-1 goes public — `locationEffect`, `watchLocation`

Named symmetric with layer 2 (`routeEffect`/`watchRoute`). `locationEffect(cb)` is an activity effect over raw `Location` returning a renderable; `watchLocation(cb)` is the non-rendering watcher. Zero-config by design — they subscribe to the location activity, which needs no table. These are the blessed replacements for the deprecated `router()`/`onRouteUpdate`, and what core's server tests and README examples migrate to.

### D5: `routing.ts` is deleted — no bridge (revised at apply review, 2026-08-15)

Originally designed as a one-release delegating bridge; revised on review because the package is pre-1.0 (breaking minors are legitimate) and the legacy API's only verified consumers were core's own tests, README, and server tests — all migrated inside this change, so a migration window protected nobody. The mapping below now documents the **migration**, not a delegation:

| Removed export         | Replacement          | Semantics notes                                                                                       |
| ---------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `router(cb)`           | `locationEffect(cb)` | raw `Location` value; fires on every update (`force`)                                                 |
| `onRoute(event, opts)` | `route(event, opts)` | `route` additionally respects modified-click fall-through (`spa-routing` spec) — a strict improvement |
| `onRouteUpdate(cb)`    | `watchLocation(cb)`  | watcher semantics unchanged                                                                           |

The delegating-bridge phase was implemented and verified first (all suites green against the bridge), then the bridge, its `routing.spec.ts` parity guard, and every deprecation notice were removed. `location.spec.ts` carries the equivalent behavioral coverage through the replacement names.

### D6: Parity risks, named

- **`force: true`** — the old activity fired effects on every update, even same-location. The location activity keeps `force`; layer-2 dedupe stays where it is today (`didRouteChange` gates the update call; `pageRouteEffect` skips same-path).
- **`didRouteChange` compares only origin/pathname/search** — hash-only navigation does not re-fire. Preserved as-is.
- **Wiring timing** — deferring `popstate`/initial-read must not change first-render behavior in the browser: the guard is the `route-activation` + `lazy-import` suites plus the wtr suite as a whole (and, during the bridge phase, `routing.spec` passing unchanged — see D5).
- **Server, post-scope updates** — a `popstate`-less server router never fires after `renderToString` returns; the synchronous-render contract from `server-rendering` is unchanged.

## Resolved question: async route content vs synchronous serialize

Route pages load through async importers (`() => import(...)` via `lazyImport`), which settle in microtasks — after `renderToString`'s synchronous pass. Route _matching_ is synchronous; the matched _page content_ is not, so a `createRoutes` app serialized naively yields the shell/fallback, not the page. This must be resolved during apply, before the route-aware SSR tests are written. Options:

1. **`renderToStringAsync(app, opts)` (leaning)** — an additive async sibling that renders, drains settled route/lazy-import work (bounded microtask/`await` loop until the route activity settles), then serializes. Keeps the sync contract of `renderToString` untouched; SSR/SSG callers are async anyway.
2. **Preload path** — a server-side helper that resolves the matched importer first and feeds a settled component in; no core render changes, but pushes orchestration onto every caller.
3. **Document the fallback** — matching is SSR-visible, page content is client-only until hydration-era work. Cheapest, but leaves SSG of real apps hollow.

**Decided (2026-08-15, apply 0.1): option 1 — `renderToStringAsync(app, opts)`**, with 2's resolve-then-serialize idea as its internal mechanism. Confirmed by the user at apply start. Implementation notes discovered against the code:

- Settled work (lazy importers) re-renders through `textUpdater`, which resolves the DOM through the provider seam — so the drain cannot happen after `withWindow` exits. `renderToStringAsync` enters the window scope across `await` boundaries (a scope-enter/exit pair in `lib/dom.ts`) and serializes concurrent async renders through an internal queue; nested synchronous `renderToString` calls remain safe because `withWindow` restores the outer scope.
- The drain is a bounded macrotask loop (dynamic `import()` settles beyond the microtask queue) that stops early once the markup is quiet between two consecutive passes.
- The synchronous render's contract is untouched: a route-table app serialized synchronously yields the shell/fallback, documented as such. This required a guard beyond D6's popstate reasoning: the page **importer** still settles after a synchronous server render returns, so the router's page-import transform drops the settled update unless the router's own window is the currently resolvable one (in a browser that is always true). Without the guard the post-scope settle would re-render into a dead scope and throw off-browser.
- **Naming revision (apply review, 2026-08-15, user call)**: since the async render is the go-to for any route-table app and the server entry has never been published (both server changesets are still pending), the async render took the unmarked name — **`renderToString` is async**, and the synchronous primitive ships as **`renderToStringSync`** (Node's `readFile`/`readFileSync` convention). No published API was renamed; both changesets were amended to tell the final story.

## Verification

- Existing suites green: `route-activation.spec`, `lazy-import.spec` (migrated to the new names), full wtr run. (`routing.spec` served as the bridge-parity guard during the bridge phase, then was deleted with the bridge — see D5.)
- New browser specs: `locationEffect`/`watchLocation`; location/route layer separation.
- New server-lane tests: module-scope `createRoutes` imports off-browser without throwing; `renderToString({ url })` renders the matched route of a `createRoutes` app; two windows/urls render independent routes (per-window isolation).
- Benchmark not required — no hot-path structure changes beyond one lazy guard; wtr timing sanity is sufficient.

## Successor

`file-based-routes` (separate change): build-time folder traversal of `src/app/pages/` emitting literal `import()` routes (`[param]/` → `:param`), single source of truth feeding `createRoutes`, `esbuild-plugin-html-split` (which today duplicates the route list by hand), and the SSG prerender page list. Depends only on this change's stabilized `createRoutes` shape.
