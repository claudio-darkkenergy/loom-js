# Design — server-first-loom-app

## Context

Core's pre-render stack is complete and spec'd: `renderToString(app, { window, url })` renders the exact client code path against an injected linkedom window (per-render provider seam, no global patching, concurrent renders serialized); `hydrate` performs a settle-gated atomic swap over served markup; `resource`/`dehydrate`/`serializeState`/`primeResources` close the double-fetch gap. The loom app predates all of it: `bootstrap.ts` creates a div, writes "loading…", and `init()`s into it; esbuild + `htmlSplit` emit empty per-route-scope shells; `apps/loom/vercel.json` rewrites `/docs/(.*)` → `/docs/index.html` and everything else → `/index.html`; all Contentful data is fetched client-side through the `/api/contentful/graphql` proxy (edge-cacheable per `content-delivery-performance`).

The sibling change `align-loom-docs-with-core-readme` lands the readiness constraints this design assumes (`docs-prerender-readiness`): SSR-safe components, content loads through `resource()` with stable keys, permanent topic slugs.

## Goals / Non-Goals

**Goals:**

- Fully rendered, edge-cached static HTML for `/` and every `/docs/<slug>` topic, with embedded dehydrated state.
- Flash-free client takeover with zero first-render network for prerendered routes.
- Content freshness without manual deploys (publish → rebuild).
- An ISR-shaped seam so on-demand regeneration is a trigger swap later, not a rewrite.

**Non-Goals:**

- ISR itself (on-demand/function-based regeneration) — future evolution, seam only.
- Request-time SSR — everything here is build-time SSG.
- Changes to `@loom-js/core` or to the API proxy's caching contract.
- Prerendering `apps/sandbox`/`apps/docs` (excluded workspaces).

## Decisions

### D1 — Prerender as a post-esbuild step in the existing tsx build

`build.mts` gains a prerender phase after `esbuild.build()` resolves: a `prerender.mts` module (run under the same `tsx` invocation) imports the app source directly, and for each route creates a fresh linkedom window, calls `renderToString(App(), { url, window })`, captures `serializeState(dehydrate(window))`, and injects both into that route's shell HTML — writing `build/index.html`, `build/docs/<slug>/index.html`.

_Alternatives considered:_ rendering the built bundle (adds a Node-loading story for hashed ESM output — the source path is simpler and `tsx` already runs the build); a separate Vercel prerender framework (nothing to gain; the app owns its esbuild pipeline).

### D2 — Shell injection contract

The html-split template gains two explicit slots: the app root element (`<div id="app">…</div>` — markup injected inside) and a state slot for the `<script type="application/json" id="loom-state">` payload. The prerender step treats the emitted shells as templates and fills the slots; dev and any non-prerendered fallback serve the shells with the slots empty. `bootstrap.ts` stops creating the root div — the shell owns it (this also retires the `document.body.prepend($app)` / `innerText = 'loading…'` boot path).

### D3 — Route discovery from Contentful at build time

`/` is static. Docs routes come from the same page-listing query the side nav uses, fetched once at build start — the prerendered set is exactly the published topic set, in listing order. A topic added in Contentful appears on the next build with no code change. Unknown paths still fall back to the SPA shell (D6), so an unpublished-then-published topic is reachable even between builds.

### D4 — Build-time data access: a base-URL seam, not a parallel client

The runtime data path (`contentfulRequest` → `/api/contentful/graphql` proxy via `__API_URL__`) can't run at build time (no `vercel dev`). Rather than fork the providers, the request layer's base URL + auth become injectable: the prerender pass points the same providers at Contentful's GraphQL endpoint directly (Delivery API token from build env; preview stays an explicit opt-in per `content-delivery-performance`), while the browser build keeps the proxy define. One query surface, two transports.

Because `align-loom-docs-with-core-readme` routes these loads through `resource()`, the settlement signal tracks them (`renderToString` serializes real content, not skeletons) and `dehydrate` captures them with no further work here.

### D5 — Boot: prime, then hydrate, everywhere

`bootstrap.ts` becomes: read `#loom-state` if present → `primeResources(JSON.parse(...))` → `hydrate({ app, root, globalConfig })`. One boot path for all environments: primed static serve (instant settle, zero network), unprimed prerendered HTML (settle-gated swap, no flash), and dev's empty root (documented graceful degradation — no dev fork). `init` remains only if a genuinely non-hydrating consumer of `Bootstrap` appears; none exists today.

### D6 — Serving & caching contract

`vercel.json` moves from blanket rewrites to static-first:

- `/docs/<slug>` resolves to the prerendered `docs/<slug>/index.html` (Vercel serves existing static files before rewrites; the blanket `/docs/(.*)` → shell rewrite remains as fallback for unknown/new topics).
- `/docs` keeps its redirect to the default topic (slug per the content map).
- Hashed JS/CSS stays immutable-cacheable; prerendered HTML is CDN-cached until the next deploy (Vercel's static default — no custom TTL headers to get wrong at the SSG stage; explicit `s-maxage`/`stale-while-revalidate` tuning belongs to the ISR evolution).

### D7 — Freshness: publish webhook → deploy hook

A Contentful `publish`/`unpublish` webhook (scoped to docs content types) calls a Vercel deploy hook. At ~13 topics, whole-site rebuild-on-publish is cheap and keeps SSG honest. The trigger volume/latency at which this stops scaling is the recorded cue to pick up ISR.

### D8 — The ISR seam

The prerender module exposes one pure entry: `prerenderRoute(url) → { html, state }`, with build-time enumeration layered on top. A future ISR change wraps that same entry in a serverless function with `stale-while-revalidate` semantics — trigger swap, not renderer rewrite. Documented as the explicit evolution path; not built now.

## Risks / Trade-offs

- [Build-time Contentful outage breaks deploys] → the prerender step fails loudly (a broken build beats silently shipping empty shells); the previous deploy keeps serving. Retry is a redeploy.
- [Stale content between publish and rebuild completion] → acceptable minutes-scale window for docs; the webhook automates the trigger; ISR is the recorded fix if the window matters later.
- [Direct-Contentful transport drifts from the proxy transport] → same providers/queries, only base URL + auth injected (D4); the two paths share every line above the transport seam.
- [Shell template slots drift from what `hydrate` expects as root] → the slot contract lives in one template module consumed by both the html-split config and the prerender injector; verification renders and hydrates each route in CI-able checks.
- [linkedom gaps for pink/appwrite markup (unusual DOM APIs during render)] → core shims the known gaps (`NodeFilter`, `location`, `history`); the per-topic prerender in verification catches any component that needs more, and `docs-prerender-readiness` pushes browser-only work to `onMounted`.
- [`renderToString` serializes renders — 14 routes render sequentially] → fine at this scale (single-digit seconds); parallelism would require per-window isolation the framework deliberately doesn't offer for async renders.

## Open Questions

- None blocking. Deploy-hook/webhook wiring details (env names, webhook filters) are settled during apply with the maintainer's Vercel/Contentful access.
