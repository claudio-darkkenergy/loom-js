# Tasks: Route-Scoped CSS Delivery

## 1. Core: route-asset-preload (TDD)

- [ ] 1.1 Red: specs in `packages/core/tests/` covering the `route-asset-preload` scenarios — assets optional/non-breaking, link injected and awaited before render, concurrent with the importer, idempotent by href and by route, error resolves after debug log, server no-op
- [ ] 1.2 Green: add `assets?: { [routePattern: string]: string[] }` to `createRoutes`, thread it through the route table, and gate `pageRouteEffect`'s render on `Promise.all([importer, loadAssets(route)])`
- [ ] 1.3 Implement `loadAssets`: resolve each URL against existing `link[rel="stylesheet"]` hrefs in the owner document; inject missing links into `<head>`; settle on `load`/`error` (error logs via the debug channel); cache settled routes per document
- [ ] 1.4 Refactor + `pnpm -F @loom-js/core type-check`, `type-check-tests`, `test-ci` pass
- [ ] 1.5 Add a **minor** changeset for `@loom-js/core`; document `assets` in `packages/core/README.md`

## 2. Plugin: shared-only entry CSS + manifest

- [ ] 2.1 In `html-split.mts`, map each route to its owned CSS bundles: dynamic JS chunks' `cssBundle`s attributed via chunk `inputs` (scope-prefix convention as fallback); inputs present in more than one route's bundles are shared
- [ ] 2.2 Compute `sharedInputs = inputs(entry cssBundle) − union(route-owned css inputs)` and rewrite the entry CSS bundle via a nested `esbuild.build` over a synthetic `@import` entry in original input order, copying `minify`/`loader`/`sourcemap`/`outdir` from `build.initialOptions`
- [ ] 2.3 Build the manifest (`routeAssets: { [route]: cssUrls[] }`), add it to `HtmlTemplateArgs`, and restore route CSS outputs to template args so prod scoped shells link their own route CSS (dev superset shell links shared CSS only)
- [ ] 2.4 Inline the manifest in the default template as a configurable global; `pnpm -F esbuild-plugin-html-split type-check` passes

## 3. App wiring

- [ ] 3.1 `template.html.mts`: inline `window.__ROUTE_ASSETS__` from `args.routeAssets` ahead of the SPA script; keep route-scope filtering for JS and re-apply it to route CSS links in prod
- [ ] 3.2 `routes.ts`: pass `window.__ROUTE_ASSETS__` to `createRoutes({ config, assets })`
- [ ] 3.3 `pnpm -F @loom-js/loom type-check` passes

## 4. Verification (fresh builds)

- [ ] 4.1 Prod build: entry stylesheet has no `styles_docContainer` / other route-scoped selectors; docs CSS bundle has them at source-count; shared rules' relative order unchanged
- [ ] 4.2 Shell audit: every shell links shared CSS; prod `build/docs/index.html` links docs CSS and no `pages-*.css` (and vice versa); manifest inlined in all shells
- [ ] 4.3 Runtime: hard-load `/` and `/docs/<topic>` (no duplicate links, no FOUC); client-side navigate `/` → `/docs` (docs CSS fetched once, styled render, devtools shows each rule once); navigate back and forth (no re-fetch)
- [ ] 4.4 Failure path: block the docs CSS URL in devtools, navigate to `/docs`, confirm the route still renders and the failure is logged
