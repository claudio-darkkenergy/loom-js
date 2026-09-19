# Route-Scoped CSS Delivery

## Why

After `dedupe-route-css-loading`, every rule loads exactly once — but through a single entry stylesheet (`spa.css`) that carries **all** routes' CSS to every page, because esbuild cannot code-split CSS and nothing loads a route's own CSS bundle at SPA-navigation time. This change completes the split: each shell ships only shared CSS plus its own route's CSS, and client-side navigation loads the next route's CSS at runtime before that route renders.

## What Changes

- `esbuild-plugin-html-split` rebuilds the entry CSS bundle to contain only shared CSS (inputs not owned by exactly one route chunk), via a second esbuild CSS pass driven by the metafile.
- The plugin emits a route-assets manifest (route scope → CSS bundle URLs) and exposes it to the HTML template so shells can inline it as a global (e.g. `window.__ROUTE_ASSETS__`).
- Production shells reference their own route's CSS bundle again (reversing that one aspect of `dedupe-route-css-loading` — links come back, but the rules no longer also live in `spa.css`).
- `@loom-js/core` gains a generic route-asset preload capability: `createRoutes({ config, assets })` accepts a map of route pattern → stylesheet URLs; the router injects missing `<link rel="stylesheet">` elements and awaits them (in parallel with the route's dynamic import) before the route renders. Framework-agnostic contract — core takes URLs, it never learns about esbuild or manifests. **Non-breaking**: `assets` is optional; behavior without it is unchanged.
- `apps/loom` wires the inlined manifest into `createRoutes`.

## Capabilities

### New Capabilities

- `route-asset-preload`: core's contract for loading per-route assets (stylesheets) before a lazily-imported route renders — dedupe against already-linked stylesheets, parallel with the chunk import, no-op on the server, unmatched routes unaffected.

### Modified Capabilities

- `app-asset-delivery`: the entry stylesheet SHALL contain only shared CSS; each prod shell references shared CSS plus its own route's CSS bundle; SPA navigation to another route loads that route's CSS at runtime with no flash of unstyled content.

## Impact

- Depends on `dedupe-route-css-loading` landing first (this change builds on its plugin classification work and revises its "no route CSS links" stance now that duplication is structurally impossible).
- `packages/esbuild/esbuild-plugin-html-split` — metafile analysis, second CSS build pass, manifest emission, template-arg surface (`private: true`, no changeset).
- `packages/core` — new `assets` option on `createRoutes`, link-injection/await logic in the router pipeline. Published: needs a **minor** changeset.
- `apps/loom` — `template.html.mts` inlines the manifest; `routes.ts` passes it to `createRoutes`.
- Payoff today is small (~8KB route CSS vs ~280KB shared); the value is the general capability for consumers with heavier per-route CSS.
