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

**Amended at apply (2026-09-11):** the prerender renders the _built bundle_ after all, via `static/js/prerender` — an extra entry point of the SAME client esbuild build (exports `prerenderRoute`, `listDocsTopics`, the transport setter; the html template filters it out of every shell). Two hard constraints killed source-under-tsx: (1) `tsx` cannot load the app's CSS imports at all, and (2) minified css-module local names are assigned per-build (verified empirically: the same class minifies to different names in two builds), so only markup rendered from the same build as the shipped stylesheets carries matching class names. The shared build also guarantees one `@loom-js/core` module instance between the app tree and the render/dehydrate calls. `linkedom` stays out of the bundle — the tsx runner (`prerender.mts`) supplies each route's window. `prerenderRoute(url, window) → { html, state }` remains the ISR seam (D8), with the window injected by the trigger.

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
- The catch-all rewrite targets `shell.html` — a pristine pre-injection copy of the home shell the prerender phase sets aside — so unknown paths boot the SPA shell rather than flashing home content (`/` itself serves the injected `index.html` by filesystem precedence).
- Hashed asset immutability is explicit: a `headers` rule in `apps/loom/vercel.json` marks `chunk|docs|pages|prism-*|font|icon` hashed files `immutable`; unhashed entries (`spa.js`, `base.css`, HTML) keep Vercel's per-deploy revalidation.
- Hashed JS/CSS stays immutable-cacheable; prerendered HTML is CDN-cached until the next deploy (Vercel's static default — no custom TTL headers to get wrong at the SSG stage; explicit `s-maxage`/`stale-while-revalidate` tuning belongs to the ISR evolution).

### D7 — Freshness: publish webhook → deploy hook

A Contentful `publish`/`unpublish` webhook (scoped to docs content types) calls a Vercel deploy hook. At ~13 topics, whole-site rebuild-on-publish is cheap and keeps SSG honest. The trigger volume/latency at which this stops scaling is the recorded cue to pick up ISR.

**Wiring (task 4.3 — maintainer dashboards):**

1. Vercel → the loom project → Settings → Git → Deploy Hooks → Create Hook: name `contentful-publish`, branch `main`; copy the hook URL.
2. Contentful space `2x238mu87414` → Settings → Webhooks → Add Webhook: URL = the deploy hook (POST), triggers = Entry `publish` + `unpublish` only, filter `sys.contentType.sys.id in [page, content]` (the docs page + topic types).
3. Also add `CTF_SPACE_ID` + `CTF_TOKEN` (Delivery token) to the Vercel project's **build** environment for Production — the prerender phase fails the build loudly without them.

### D8 — The ISR seam

The prerender module exposes one pure entry: `prerenderRoute(url) → { html, state }`, with build-time enumeration layered on top. A future ISR change wraps that same entry in a serverless function with `stale-while-revalidate` semantics — trigger swap, not renderer rewrite. Documented as the explicit evolution path; not built now.

## Risks / Trade-offs

- [Build-time Contentful outage breaks deploys] → the prerender step fails loudly (a broken build beats silently shipping empty shells); the previous deploy keeps serving. Retry is a redeploy.
- [Stale content between publish and rebuild completion] → acceptable minutes-scale window for docs; the webhook automates the trigger; ISR is the recorded fix if the window matters later.
- [Direct-Contentful transport drifts from the proxy transport] → same providers/queries, only base URL + auth injected (D4); the two paths share every line above the transport seam.
- [Shell template slots drift from what `hydrate` expects as root] → the slot contract lives in one template module consumed by both the html-split config and the prerender injector; verification renders and hydrates each route in CI-able checks.
- [linkedom gaps for pink/appwrite markup (unusual DOM APIs during render)] → core shims the known gaps (`NodeFilter`, `location`, `history`); the per-topic prerender in verification catches any component that needs more, and `docs-prerender-readiness` pushes browser-only work to `onMounted`. **Found at apply:** two readiness gaps remained and were fixed here per task 1.2's escape hatch — `matchQuery` (lib/utils) called `window.matchMedia` bare during render (now server-inert: reports "no match" once and stays quiet, so toggles hold initial state; the browser hydration pass re-runs it with the real API pre-swap), and `useDocsLayout`'s once-per-process module flag left every prerender window after the first without watchers (now registered per layout mount with `onUnmounted` teardown — per-window off-browser, no stacking in the browser). Consequence of the toggle default: prerendered markup ships with the side nav collapsed; it opens at the hydration swap on desktop. Two more verification findings (2026-09-11, maintainer review of rendered pages): (1) the shell root's `id="app"` woke a dormant `#app { padding: 0 24px 24px }` rule in the app's own `base.css` — root renamed `loom-app` and the stale rule deleted; (2) reload-with-fragment landed misaligned — with `scrollRestoration: 'manual'` the browser performs no fragment scroll on reload, and the router's boot-owed `scrollIntoView` targeted the pre-swap server DOM (and, being smooth per the page's `scroll-behavior` CSS, pauses entirely in background tabs) — fixed as a core patch: `hydrate` re-runs the fragment scroll instantly against the post-swap layout (changeset `hydrate-boot-fragment-realign`). Also observed (pre-existing, not this change): the client render fetches a literal `⚡` URL once per boot — a template attr token briefly live on a detached `<img>`; candidate core fix, tracked as a follow-up.
- [`renderToString` serializes renders — 14 routes render sequentially] → fine at this scale (single-digit seconds); parallelism would require per-window isolation the framework deliberately doesn't offer for async renders.

## Open Questions

- None blocking. Deploy-hook/webhook wiring details (env names, webhook filters) are settled during apply with the maintainer's Vercel/Contentful access.
