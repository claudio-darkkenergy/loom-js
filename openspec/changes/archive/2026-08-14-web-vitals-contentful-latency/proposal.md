# Web Vitals & Contentful Latency

## Why

Lighthouse baselines against the running app (dev server, 2026-08-14) confirm the suspicion that Contentful content lands too late — and show the skeleton loaders are masking a compound problem:

| Route               | Perf score | FCP   | LCP                         | CLS   | TBT    |
| ------------------- | ---------- | ----- | --------------------------- | ----- | ------ |
| `/` (home)          | 71         | 3.9 s | 5.3 s (Contentful hero img) | 0     | 0 ms   |
| `/docs/get-started` | 64         | 3.9 s | 5.9 s (topic rich text)     | 0.078 | 230 ms |

The measured content path on a docs route: a **~760 ms CORS preflight** (no `Access-Control-Max-Age`, so it repeats) serialized ahead of **two parallel GraphQL POSTs of ~1.0–1.1 s each** through the `/api/contentful/graphql` proxy — ~1.9 s from navigation to content even on localhost. Direct RTT to `graphql.contentful.com` is ~65 ms, so nearly all of that time is recoverable: requests default to the uncached **Preview API** (`CTF_IS_PREVIEW` defaults to `true` unless explicitly `'false'`), the proxy sets **no cache headers** (every user pays a full origin→Contentful round trip every navigation), and both metrics sit behind a fully client-rendered shell (`<body>` is empty until JS executes).

Independent of the fetch path, asset delivery undermines every route: the route-splitting that `esbuild-plugin-html-split` + `lazyImport` are supposed to provide is defeated (both routes' HTML references **both** route chunks and **all** CSS), 285 KB of unpurged Pink CSS plus a 1.5 MB icon sprite block render, fonts load with no `font-display` behind a render-blocking third-party MyFonts `@import`, the LCP hero image ships `width="auto" height="auto"` with no fetch priority, and dev-only code (`new EventSource('/esbuild')`, framework `debug: true`) ships in production bundles.

## What Changes

Grouped into three sweeps (each independently shippable and re-measurable):

**Sweep 1 — Content latency (validated hunch):**

- Production content requests use Contentful's cached **Delivery API**; preview mode becomes an explicit opt-in instead of the default-on fallback.
- The `/api/contentful/graphql` proxy responds with CDN cache headers (`s-maxage` + `stale-while-revalidate`) so repeat content reads are served from Vercel's edge cache, not Contentful.
- CORS preflights are cached via `Access-Control-Max-Age`, removing the repeated ~1 RTT tax in front of every content POST.
- The two docs-route GraphQL POSTs (side-nav page listing + topic body) merge into one GraphQL document.
- Navigating to an already-fetched topic renders it immediately instead of resetting to `undefined` and flashing the skeleton.
- GraphQL `errors` are no longer silently dropped by the proxy envelope (`data: data?.data`); failures surface to the app instead of presenting as a permanent skeleton.

**Sweep 2 — Asset delivery:**

- Each route's HTML references only its own JS/CSS (fix the `checkIsEntryPoint`/template scoping so lazy route chunks stop being eagerly loaded everywhere).
- Dev-only artifacts (`EventSource('/esbuild')` reconnect loop, framework `debug` logging) are excluded from production builds.
- Fonts get `font-display: swap`; the render-blocking MyFonts tracking `@import` is removed from the CSS chain; unused font weights/formats are trimmed.
- The LCP hero image gets real intrinsic dimensions and `fetchpriority="high"`; Contentful image URLs keep serving webp at sized widths.
- Render-blocking CSS shrinks: purge/trim the Pink import (285 KB) and the 1.5 MB icon sprite it drags in; dead build artifacts (`rollbar.js`, `brand.js`) are dropped.

**Sweep 3 — Verify & hold the line:**

- Re-run the Lighthouse baseline on `/` and `/docs/get-started` after each sweep; record the numbers in the change.
- Document the measurement procedure so regressions are checkable without re-deriving it.

## Capabilities

### New Capabilities

- `content-delivery-performance`: The Contentful content path — delivery vs. preview API selection, proxy/CDN caching, preflight caching, request batching per route, cached-content navigation behavior, and GraphQL error surfacing.
- `app-asset-delivery`: What each route's HTML is allowed to load — route-scoped chunks/CSS, no dev-only code in production output, font loading policy, and LCP image delivery (dimensions, priority, format).

### Modified Capabilities

- `http-request-caching`: One additive requirement — an `adapter` may throw to reject a semantically-failed 2xx response, producing an uncached error result (needed so GraphQL error envelopes aren't cached as successes). The existing cache/single-flight contract is unchanged; the skeleton-flash fix is app-level rendering behavior and lands in `content-delivery-performance`.

## Impact

- **`services/api`**: `contentful/graphql.ts` (cache headers), `utils/edge/edge-response.ts` (preflight max-age, error envelope — also fixes the "GraphQL error renders as permanent skeleton" bug).
- **`apps/loom`**: `project/client/` build config + HTML template (route scoping, dev defines), `src/app/bootstrap.ts` (EventSource/debug guards), `src/app/logic/providers/contentful/` + `logic/hooks/` (merged query, preview flag, cached-topic behavior), `public/styles/` (fonts, CSS trim), hero/page components (image attrs).
- **`packages/esbuild/esbuild-plugin-html-split`**: possibly `checkIsEntryPoint` (or just pass `entryPoints`/scope-filter from the app template) — if the plugin changes, it needs a changeset.
- **Env/config**: `CTF_IS_PREVIEW` semantics flip to explicit opt-in for preview; Vercel project env must set it deliberately per environment.
- **No changes** to `@loom-js/core` runtime or to the client `request` cache contract.
