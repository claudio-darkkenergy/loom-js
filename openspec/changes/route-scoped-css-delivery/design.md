# Design: Route-Scoped CSS Delivery

## Context

esbuild emits, for a split build, an entry CSS bundle containing every reachable CSS input (including through dynamic imports) plus a `cssBundle` per dynamic JS chunk repeating that chunk's own CSS. `dedupe-route-css-loading` resolves the duplication by linking only the entry bundle — at the cost of shipping all routes' CSS everywhere and leaving route CSS files unfetched. esbuild has no CSS-injection runtime: `import('docs-chunk.js')` never loads `docs-chunk.css`, which is why the all-in-one entry stylesheet was load-bearing for SPA navigation.

Three pieces are missing for a true split: (1) an entry stylesheet with route-owned CSS removed, (2) a build-time manifest saying which stylesheets each route needs, (3) a runtime that loads those stylesheets before a route renders. (1) and (2) are build concerns → the plugin; (3) executes in the browser → `@loom-js/core`.

Core constraint: zero runtime dependencies and no bundler awareness — core may accept URLs keyed by route pattern, nothing more specific.

## Goals / Non-Goals

**Goals:**

- Entry stylesheet = shared CSS only; each route's CSS is fetched exactly when that route is (initial shell link or SPA-navigation runtime load).
- No flash of unstyled content: a route's CSS is applied before its content renders, on hard load and on client-side navigation.
- Core API is generic and optional: `assets` maps route patterns to URL lists; omitting it changes nothing.
- Manifest generation and entry-CSS rewriting are metafile-driven inside `esbuild-plugin-html-split`.

**Non-Goals:**

- Preloading non-CSS assets (fonts, images). The core contract (`assets: URLs to have loaded before render`) is deliberately shaped so stylesheet loading is just its first implementation, but only stylesheets ship in this change.
- Speculative prefetching of other routes' CSS on idle/hover — a possible later layer on the same manifest.
- Waiting on the entry stylesheet or CSS entry points; only per-route deltas are managed.

## Decisions

### 1. Manifest shape: route pattern → stylesheet URLs

```json
{
    "/": ["/pages-LZISJQOZ.css"],
    "/docs": ["/docs-H4IA7SAS.css"]
}
```

Keys are the plugin's shell routes. **Amended at apply:** where a router pattern carries params (`/docs/:topic`), the shell route (`/docs`) can't equal the pattern, so the app bridges manifest keys to its own `config` keys when passing `assets` — a few explicit lines in the one place both vocabularies are owned. A chunk-keyed map (`docs-EP52T6LO.js` → css) was rejected as the app-facing contract: hashed chunk names are unknowable to app code. Internally the plugin derives route ownership per CSS bundle and rolls it up to routes.

### 2. Route ↔ chunk mapping via metafile inputs, scope prefix as fallback

**Amended at apply:** bundle membership alone misattributes shared CSS — `PageLayout`'s stylesheet sat in the pages bundle yet is imported by shared code, and the first build shipped docs pages with an unstyled header. Ownership is now decided on the metafile's import graph: a CSS input is route-owned only when every importer (followed through `@import` chains) lives in that route's chunk subgraph. Route CSS bundles are also rewritten to their owned inputs (the same nested-build technique as the entry), so a shared rule exists in exactly one delivered stylesheet — nothing dropped, nothing applied twice.

For each dynamic JS chunk with a `cssBundle`, the plugin checks the chunk's `inputs` for the route's source module (the target of the route's `import()`, resolvable from the `routes`/`routeScopes` options plus each output's `inputs`). Where that lookup is ambiguous, the existing scope-prefix convention (`docs-*` ↔ `/docs`) is the fallback — it is already what `template.html.mts` relies on. A CSS input imported by more than one route's subgraph lands in its own shared chunk `cssBundle` or stays in the entry stylesheet; either way it must never be subtracted as route-owned (see Decision 3).

### 3. Entry CSS rewrite: second esbuild pass over shared-only inputs, not byte slicing

**Amended at apply (2026-09-17):** the rewrite is only sound if css-module class names are build-stable. Under full `minify`, esbuild assigns css-module local names per build — a nested pass cannot reproduce the names already baked into the emitted JS, and at least one shared css-module input exists (`PageLayout`'s stylesheet), whose styles would silently break. esbuild 0.28 offers no css-naming option, so the app's prod build drops identifier minification (`minifyWhitespace` + `minifySyntax`, no `minify`): local names take the deterministic `stem_name` form in every pass. Measured cost across all app JS: +37 KB raw, **+4.2 KB gzipped (~10%)** — accepted by the maintainer. Recorded follow-up: full minify can return via a single-build two-pass (analyze, then rebuild once with synthetic shared/per-route CSS entries so one mangle pool names everything) — opt-in and prod-only, since it ~doubles build time.

From the metafile: `sharedInputs = inputs(entryCssBundle) − union(inputs of route-owned cssBundles)`. The plugin writes a synthetic entry (`@import` lines in the entry bundle's original input order, preserving cascade order) and runs a nested `esbuild.build` with the parent build's relevant options (`minify`, `loader`, `outdir`, `sourcemap`) to overwrite the entry CSS bundle in place. Byte-slicing the existing output via `bytesInOutput` was rejected: no offsets are published, and minified output has no reliable section delimiters. An input appearing in **any two** route bundles is treated as shared (kept in the entry) so it can never go missing or double-load.

### 4. Core API: `assets` option on `createRoutes`, awaited alongside the importer

```ts
createRoutes({
    config: { [RoutePath.Docs]: () => import('@/app/pages/docs/') },
    assets: window.__ROUTE_ASSETS__ // { '/docs': ['/docs-H4IA7SAS.css'] }
});
```

When a route matches, the router starts the dynamic import and the asset loads concurrently and renders only after both settle. Loading a URL means: if no `link[rel="stylesheet"]` with that resolved `href` exists in the owner document, append one to `<head>` and await its `load`/`error`; if one exists, resolve immediately (hard loads already have the shell's link). Implementation hangs off the existing page-import pipeline (`pageRouteEffect` / the `lazyImport` activity) so caching semantics match chunk caching: a route's assets settle once per session. `error` resolves rather than rejects (a failed stylesheet must not hard-block navigation) but logs through the framework's debug channel. Server/no-window: the asset step is skipped entirely.

Alternative rejected: per-entry config objects (`{ importer, assets }`) — churns the `RoutesConfig` type and every consumer for no expressiveness gain over a parallel map keyed identically.

### 5. Manifest transport: template arg → inline script global

`HtmlTemplateArgs` gains `routeAssets` (the manifest). The default template and `apps/loom`'s template inline it: `<script>window.__ROUTE_ASSETS__ = {...}</script>` ahead of the SPA script. A separate fetched JSON file was rejected — it adds a render-blocking round trip or a race with first navigation; the manifest is tens of bytes. The global's name is app-chosen (loom uses `__ROUTE_ASSETS__`); core never reads globals, it only receives the map as an argument.

### 6. Shell links: shared CSS + own route CSS

Prod scoped shells link the (now shared-only) entry stylesheet, CSS entry points, and their own route's CSS bundle — restoring the route CSS links that `dedupe-route-css-loading` removed, which is safe now that those rules no longer exist in the entry bundle. The dev superset shell links shared CSS only and lets the runtime loader fetch route CSS, exercising the runtime path constantly in development. Hard loads on prod shells hit the dedupe-by-href check (link already present → no-op).

## Risks / Trade-offs

- [FOUC if render wins the race with CSS] → Render is gated on the asset promise, same as it already gates on the chunk import; the failure mode is a slower route swap, not unstyled content.
- [Nested esbuild pass drifts from parent build options] → Options are copied from `build.initialOptions` at run time, not duplicated in config; the verification task diffs shared-only output rules against the original entry bundle minus route bundles.
- [Cascade-order change from rewriting the entry bundle] → `@import` order mirrors the metafile's input order for the original bundle; a scenario asserts a shared rule's specificity winner is unchanged on both routes.
- [A stylesheet 404s at navigation time (stale deploy)] → `error` resolves after logging; the route still renders (best-effort styling) instead of trapping the user on the previous page. Chunk-import failure handling is unchanged and remains the harder failure.
- [Manifest global and `assets` map drift apart] → Single producer: only the plugin writes the manifest; the app passes it through verbatim.

## Migration Plan

1. Land after `dedupe-route-css-loading` is archived (it establishes the plugin's cssBundle classification this builds on).
2. Plugin + core + app land together in one change; core's `assets` option is independently releasable (minor changeset) and inert until an app passes it.
3. Rollback: stop passing `assets` and disable the plugin's subtraction flag — shells revert to the all-in-one entry stylesheet from `dedupe-route-css-loading` behavior.

## Open Questions

_None._
