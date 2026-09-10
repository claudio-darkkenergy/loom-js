# Server-first loom app (SSG, hydration, edge caching)

## Why

`@loom-js/core` ships a complete pre-rendering story — `renderToString`, flash-free `hydrate`, and dehydrated state (`resource`/`dehydrate`/`primeResources`), all spec'd under `server-rendering`, `client-hydration`, and `dehydrated-state` — but the loom app uses none of it: it boots `init()` into a dynamically created div, Vercel rewrites every path to an empty SPA shell, and all content is fetched client-side. First paint is "loading…", SEO sees an empty body, and the framework's own showcase app doesn't demonstrate its flagship capability. It's also loom's dogfood proof that the SSG→hydrate path works end to end in a real product.

## What Changes

- Add a **prerender step** to the loom app's production build: after esbuild, render `/` and every docs topic route through `renderToString` (linkedom window per route), capture dehydrated state with `dehydrate` + `serializeState`, and inject markup + state script into each route's html-split shell — emitting one static, fully rendered `index.html` per route.
- Docs routes are **discovered at build time** from the Contentful page listing — no hardcoded slug list; the topic set and order stay Contentful-owned (per `align-loom-docs-with-core-readme`'s content map).
- Restructure `bootstrap.ts` from `init()`-into-a-created-div to **`hydrate()` onto the served markup**, priming the resource cache from the embedded state first — first render settles from local data with zero network and no flash. Dev keeps working unchanged: `hydrate` on an empty root degrades gracefully.
- Serve prerendered HTML as **static files from the CDN** (edge-cached by default): `vercel.json` rewrites move from blanket SPA fallbacks to per-topic static paths, with an SPA fallback only for unknown paths; hashed assets stay immutable.
- **Rebuild on publish**: a Contentful publish webhook triggers a Vercel deploy hook, so SSG content stays fresh without manual deploys.
- Keep an **ISR-shaped seam**: the prerender logic is a reusable module (route in → `{ html, state }` out), so evolving to on-demand regeneration (a function + `stale-while-revalidate`) later swaps the trigger, not the renderer. ISR itself is explicitly out of scope.

## Capabilities

### New Capabilities

- `app-prerendering`: the loom app's SSG contract — which routes prerender, that they serialize settled content (not skeletons) through the same render path the client runs, and that each carries its dehydrated state.
- `app-hydration-boot`: the client boot contract — prime-then-hydrate, no flash, no first-render refetch, graceful empty-root degradation in dev.
- `app-edge-caching`: the serving contract — prerendered HTML is CDN-served static output, per-deploy fresh, rebuilt on content publish; hashed assets immutable; ISR recorded as the future evolution.

### Modified Capabilities

<!-- none — server-rendering / client-hydration / dehydrated-state are core capabilities and unchanged; content-delivery-performance and app-asset-delivery requirements still hold over prerendered output (first docs load now beats the single-request budget by priming) -->

## Impact

- `apps/loom/project/client/` — build pipeline gains the prerender step; shell template gains the app root + state-script slots.
- `apps/loom/src/app/bootstrap.ts` — `init` → `primeResources` + `hydrate`.
- `apps/loom/src/app/logic/providers/` — base-URL/auth seam so build-time renders reach Contentful directly (the `/api` proxy is runtime-only).
- `apps/loom/vercel.json` — static-first rewrites, redirects for `/docs`.
- Vercel + Contentful config — deploy hook and publish webhook.
- Depends on `align-loom-docs-with-core-readme`'s readiness work (`docs-prerender-readiness`: SSR-safe components, `resource()`-routed data, permanent slugs). Homepage prerendering can proceed before the docs content alignment completes.
- No `@loom-js/core` changes; new dev-time dependency: `linkedom` in the loom app workspace.
