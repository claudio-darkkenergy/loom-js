# Align the loom docs app with core/README.md

## Why

`packages/core/README.md` is now the accurate, single source of truth for the framework's API (per `core-readme-accuracy`), but the docs app (`@loom-js/loom`) doesn't reflect it — its Contentful-driven topics predate the README scrub and cover a different, thinner slice of the API. Consumers landing on the docs site get stale or missing guidance, while the good documentation is trapped in a single-page markdown file on npm/GitHub.

## What Changes

- Restructure the docs section's information architecture into one topic per core README concept (bootstrapping, configuration, components, custom elements, activities, routing, lazy imports, SSR/SSG, hydration, dehydrated state, diagnostics, plus a getting-started entry), each with its own route under `/docs/:topic` — multi-page navigation instead of a single long page.
- Author the README-aligned content as Contentful topics (the existing pipeline stays the runtime source). The change produces a canonical content map — README section → topic slug, ordering, and per-topic outline — that drives the Contentful entry work and makes README↔docs drift checkable.
- Extend the docs UI where the content demands it (e.g. code samples, callouts, prev/next topic navigation, API tables). New app components are composed from existing `@loom-js/pink` components first.
- Where a needed component doesn't exist in `@loom-js/pink`, it is ported from the upstream [appwrite/pink](https://github.com/appwrite/pink) library into a loom pink component — **each such port requires the maintainer's explicit approval before any code is written**. No approval, no new pink component.
- No `@loom-js/core` API changes. Content must match the README as it stands after the in-flight `core-api-follow-ups` change lands (`placement`, route `guard`, `lazyImport` typing all touch README sections).
- Everything this change builds is **prerender-ready**: components render under `renderToString` (no bare-global DOM access outside `onMounted`/event handlers), docs content loads through core's keyed `resource()` cache, and topic slugs are treated as permanent static paths. The server-first pipeline itself (SSG, hydration boot, edge caching) is the sibling change `server-first-loom-app`; this change guarantees nothing it ships will block that one.

## Capabilities

### New Capabilities

- `docs-information-architecture`: the docs section's shape — one topic per core README concept, slug/order contract, side-nav listing, and per-topic routing under `/docs/:topic`.
- `docs-content-coverage`: the parity contract — every consumer-facing concept in `packages/core/README.md` has a corresponding docs topic whose content is accurate to the current API; the content map in this change is the checkable mapping.
- `docs-component-sourcing`: the sourcing rules for docs UI — compose from `@loom-js/pink` first; port from upstream appwrite/pink into `@loom-js/pink` only with explicit maintainer approval per component; no one-off app-local styling where a pink component fits.
- `docs-prerender-readiness`: the server-first readiness contract — docs components serialize under `renderToString`, content loads route through `resource()` so dehydration can capture them, and topic slugs are permanent (they become physical prerendered paths under `server-first-loom-app`).

### Modified Capabilities

<!-- none — existing docs specs (docs-toggle-boundaries, content-delivery-performance, app-asset-delivery) are unaffected at the requirement level -->

## Impact

- `apps/loom/src/app/pages/docs/**` — navigation, layout, topic rendering for the new IA.
- `apps/loom/src/app/components/**` — new content components (composed from pink).
- `packages/pink/**` — only if component ports are approved; each approved port is a pink change (minor changeset, per `pink-stays-pre-1-0` convention).
- Contentful space — topic entries per the content map; content-model changes only if the outline demands a field the model lacks.
- No changes to `@loom-js/core` or `services/api`.
