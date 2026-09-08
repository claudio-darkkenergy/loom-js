# Dedupe Route CSS Loading

## Why

Every route-level CSS rule in `@loom-js/loom` is applied twice in the browser (visible as duplicated rule blocks in devtools' Styles tab, e.g. on the topic TOC link). esbuild does not code-split CSS: the SPA entry's stylesheet (`static/js/spa.css`) contains **all** CSS reachable from the entry — including CSS reached only through dynamic route imports — while each route chunk _also_ emits its own CSS bundle (`docs-*.css`, `pages-*.css`) with the same rules. The `esbuild-plugin-html-split` HTML shells link both, so the same rules load twice on every page.

## What Changes

- `esbuild-plugin-html-split` stops linking CSS bundles that belong to non-entry (dynamically imported) JS chunks, since their content is already fully contained in the entry's CSS bundle. Identification is metafile-driven (a JS chunk's `cssBundle` where the chunk has no `entryPoint`), not name-based.
- Genuine CSS entry points (e.g. `static/styles/base.css`) and entry-point CSS bundles (e.g. `spa.css`) keep loading exactly as today.
- `apps/loom`'s `template.html.mts` route-scope filtering simplifies: it now only applies to JS resources (route-scoped CSS links no longer exist to filter).
- Route-scoped CSS _delivery_ (serving only a route's own CSS bytes) is explicitly deferred until esbuild supports CSS code splitting; today the entry stylesheet already ships all CSS to every route, so nothing regresses — the duplicate application goes away and total CSS bytes go down.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `app-asset-delivery`: CSS is delivered exactly once — no rule may reach the browser through more than one linked stylesheet. Route shells reference shared stylesheets only; per-route CSS chunk files are not linked (their content is subsumed by the entry stylesheet). The existing "route HTML loads only its own assets" requirement is amended to scope its CSS expectations accordingly (JS scoping is unchanged).

## Impact

- `packages/esbuild/esbuild-plugin-html-split/src/html-split.mts` and `helpers.mts` — output classification gains cssBundle awareness. Package is `private: true`, so no changeset is required.
- `apps/loom/project/client/template.html.mts` — scope filter narrows to JS.
- Both dev (superset shell) and prod (scoped shells) duplication paths are fixed by the same plugin change.
- `apps/sandbox` (out of workspace) uses the same plugin and benefits when rebuilt; no action needed there.
