# Tasks — server-first-loom-app

## 1. Data seam (build-time transport)

- [ ] 1.1 Make the request layer's base URL + auth injectable so the same Contentful providers run against the `/api` proxy in the browser and Contentful's GraphQL endpoint directly at build time (Delivery API; preview stays opt-in); document required build env vars
- [ ] 1.2 Confirm docs/home loads flow through `resource()` with stable keys (landed by `align-loom-docs-with-core-readme` task 3.7) — if that change hasn't landed them yet, do it here first

## 2. Shell & prerender pipeline

- [ ] 2.1 Add the app-root and state-script slots to the html-split shell template (shell owns the root element; slots empty in dev/fallback output)
- [ ] 2.2 Add `linkedom` to the loom app workspace (dev dependency) and remember `.prettierrc` `packageJSONFiles` needs no change (existing workspace)
- [ ] 2.3 Write `prerenderRoute(url) → { html, state }` as a reusable module: fresh linkedom window, `renderToString(App(), { url, window })`, `serializeState(dehydrate(window))` — the ISR seam (D8)
- [ ] 2.4 Wire the build-time enumerator: fetch the docs page listing, prerender `/` + every `/docs/<slug>`, inject into shells, emit `build/index.html` and `build/docs/<slug>/index.html`; fail the build loudly on unreachable content or non-settling routes
- [ ] 2.5 Hook the prerender phase into `build.mts` after `esbuild.build()`; dev (`dev.mts`) is untouched

## 3. Hydration boot

- [ ] 3.1 Restructure `bootstrap.ts`: drop the created div / `loading…` / `body.prepend`; read `#loom-state` if present → `primeResources` → `hydrate({ app, root, globalConfig })`; one path for primed, unprimed, and empty-root boots
- [ ] 3.2 Re-home the boot-adjacent side effects (`theme-dark` class, MyFonts beacon, dev live-reload hook) so none of them touch served markup pre-swap

## 4. Serving & freshness

- [ ] 4.1 Update `apps/loom/vercel.json`: static files win for prerendered routes, blanket rewrites remain only as unknown-path fallback, `/docs` redirect targets the content map's default topic
- [ ] 4.2 Verify caching behavior: hashed assets immutable, prerendered HTML refreshed by deploy (no custom TTL headers at the SSG stage, per D6)
- [ ] 4.3 Create the Vercel deploy hook and the Contentful publish/unpublish webhook (scoped to docs content types) pointing at it — maintainer holds the dashboard access; record the wiring in this change

## 5. Verification

> Assumes `activity-transform-concurrency`'s semantics have landed — prerender settlement and hydration verification lean on latest-dispatch-wins (no stale transform commits during the settle wait).

- [ ] 5.1 Build output audit: every published topic has rendered HTML (no skeleton markup) + a parseable state script produced via `serializeState`; home route rendered
- [ ] 5.2 Hydration audit on a production build: no flash on takeover, zero network for resource-backed data on first render of a prerendered route, unknown-path fallback boots and routes client-side
- [ ] 5.3 Dev-mode audit: `pnpm -F @loom-js/loom dev` behaves as today (empty-root hydrate, live reload intact)
- [ ] 5.4 Regression pass against existing specs: `app-asset-delivery` (route HTML still loads only its own assets — state script included), `content-delivery-performance` (proxy caching untouched; SPA navigations still one batched request), docs toggles
- [ ] 5.5 `pnpm -F @loom-js/loom type-check` green; `pnpm format` over touched files
