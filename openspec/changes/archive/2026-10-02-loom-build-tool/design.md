# Design — loom-build-tool

## Context

The build path today, per app:

```
build.mts ──► clientConfig() ──► esbuild.build ──► htmlSplit (private plugin) ──► shells
    │                                                      │
    └── isProd ──► prerender.mts ──► static/js/prerender.js ──► linkedom render ──► injectPrerender ──► index.html per route
```

`apps/loom/project/client/` carries ~450 lines of this (`config.mts`, `build.mts`, `dev.mts`, `template.html.mts`, `prerender.mts`); `apps/sandbox` is a ~110-line copy without the prerender. The shell ↔ boot contract (`src/app/boot-contract.ts`) is app code that both the build and the client import. The plugin is `private: true`. Constraints: output layout, Vercel serving (`vercel.json` static-first + fallback), turbo task graph, `LOOM_BUILD_DIR` isolation and the `__API_URL__` / `__CTF_IS_PREVIEW__` / `__DEV__` defines must survive unchanged — `app-asset-delivery`, `app-prerendering`, `app-edge-caching` and `route-asset-preload` pin them.

## Goals / Non-Goals

**Goals:**

- One published package, `@loom-js/build`, is the blessed way to build a loom app: `loom build` / `loom dev` + `loom.config.ts`.
- A minimal app's config is a handful of declarative fields; everything esbuild-specific is hidden unless the escape hatch is reached for.
- The prerender phase is generic: route enumeration, validation and post-render steps are app hooks, the pipeline is the tool's.
- `@loom-js/esbuild-plugin-html-split` is usable on its own by raw-esbuild consumers.
- `apps/loom` and `apps/sandbox` produce byte-equivalent-in-shape output after migrating (same files, same slot contract, same env).

**Non-Goals:**

- Vite / webpack adapters (later changes; the option surface is designed not to leak esbuild names so they can slot in).
- ISR / on-demand regeneration — the per-route render stays the seam, nothing more.
- A dev-server rewrite: `loom dev` wraps `esbuild.context().serve()` as today (watch + SPA fallback), no HMR.
- Changing the shell contract, output paths or the plugin's splitting semantics.

## Decisions

### D1 — `@loom-js/build` is a CLI + config package, programmatic API underneath

`loom build` and `loom dev` (bin `loom`) load `loom.config.{ts,mts,js,mjs}` from the cwd and run. `defineConfig(config | ({ mode }) => config)` gives typing and a mode-aware function form (vite's shape), so apps read their own env (`API_URL`, `CTF_IS_PREVIEW`) in the config and the tool never learns app-specific variables. `build(config)` / `dev(config)` / `prerender(config)` are exported too — the CLI is a thin layer over them, and a consumer with an exotic setup scripts them directly.

Config loading: the CLI bundles the config file with esbuild (`bundle: true, platform: node, format: esm`, externals = everything in `node_modules`) to a temp file next to it and imports it — no `tsx` dependency, no loader hooks; `tsx` leaves the app manifests.

_Alternative rejected:_ programmatic-only (`build.mts` stays per app) — keeps three files per app the tool exists to remove.

### D2 — Option surface: declarative first, `esbuild` escape hatch last

```ts
export default defineConfig(({ mode }) => ({
    entry: './src/app/bootstrap', // → static/js/spa
    styles: ['./public/styles/base.css'], // → static/styles/<name>
    routes: ['/', '/docs'],
    define: { __API_URL__: process.env.API_URL ?? '' }, // values JSON-encoded
    publicDir: './public/static', // → <outDir>/static
    copy: [{ from: './mocks/**/*', to: './mocks' }],
    html: { title: (scope) => ..., head: (args) => '...', template }, // template = full override
    server: { port: 9092 },
    prerender: { entry: './src/app/prerender.entry', routes, setup, validate, after },
    esbuild: (options) => options // raw escape hatch, applied last
}));
```

- `mode` is `'production' | 'development'`: `loom build` is production unless `--mode development` / `NODE_ENV=development`; `loom dev` is always development. `minify`, `sourcemap`, `logLevel`, `twoPassCss`, route-scoped shells and `__DEV__` all key off it — `__DEV__` is defined by the tool.
- `outDir` defaults to `build`; `--outDir` / `LOOM_BUILD_DIR` override it. The tool wipes `outDir` itself (`rm -rf`), replacing `esbuild-plugin-clean` and its "inside cwd only" quirk.
- Route scopes: the plugin already owns the chunk-prefix convention (`routeScopeOf`: the route path, `/` → `/pages`) and exports it (found at 2.1 — it was hardcoded in `route-css.ts`, the loom app's `routeScopes` define merely mirrored it). `routes` stays `string[]`; the tool's default template derives scopes with `routeScopeOf`, no scope option.
- `loader` for fonts/svg, `format: 'esm'`, `splitting`, `keepNames`, `bundle` are fixed tool defaults; `esbuild(options)` is the only way to touch them.
- `publicDir` + `copy` replace `esbuild-plugin-copy` (kept as an internal dep).

_Wrapper test (D2 of `docs-build-tool-topic`):_ the sandbox config drops from 55 lines + 34 lines of scripts to ~12 lines and zero scripts; the loom app from ~330 to ~60 (config + hooks). Passes.

### D3 — Default shell template, overridable in layers

The current loom template (`template.html.mts`) becomes the tool's default: route-scoped prod shells, dev superset shell, dynamic route chunks preloaded, non-route dynamic chunks left to `import()`, prerender bundle excluded, `__ROUTE_ASSETS__` inlined, `theme-dark`-free body carrying the two boot slots. `html.title(scope)` and `html.head(args)` cover the common deltas (the loom app's `dns-prefetch` and body class move to `head` / a `bodyClass` option); `html.template` replaces the whole thing for anyone who needs to. The template receives the plugin's `HtmlTemplateArgs` unchanged, so an override written against the plugin alone keeps working.

### D4 — Prerender: the pipeline is the tool's, the app supplies four hooks

```
loom build (prod) ──► esbuild ──► shells ──► prerender phase
   preserve shells (shell.html, per-scope fallbacks) ──► font preloads ──► for route of hooks.routes():
   fresh linkedom window ──► bundle.prerenderRoute(url, window) ──► hooks.validate ──► injectPrerender ──► <outDir>/<route>/index.html
   ──► hooks.after()
```

- `prerender.entry` is added to the client build as `static/js/prerender` (same build → same css-module names + core instance, as today). The tool loads it from `outDir` and requires one export: `prerenderRoute(url, window) → { html, state }`.
- `setup(bundle)` runs once before enumeration (loom: `configurePrerenderTransport`); `routes(bundle)` returns the route list (loom: `/` + `/docs/<slug>` from `listDocsTopics`); `validate(route, { html, state }, bundle)` throws to fail the build (loom: title + resource-key checks); `after({ outDir, bundle })` runs post-emit (loom: `llms.txt` / `llms-full.txt`).
- Shell for a route = the longest configured route that prefixes it (`/docs/x` → `docs/index.html`; `/` → `index.html`). Generic sanity checks stay in the tool: non-empty markup, state parses, both slots present.
- `linkedom` is the tool's dependency; the app no longer lists it.
- `prerender` runs only in production mode; `loom prerender` re-runs the phase against an existing `outDir` for iteration.

### D5 — The boot contract lives in core

`APP_ROOT_ID`, `STATE_SCRIPT_ID`, `appRootSlot`, `stateScriptSlot` and `injectPrerender` move to `packages/core/src/boot-contract.ts`, re-exported from both `@loom-js/core` (the client boot reads the ids) and `@loom-js/core/server` (the injector). The default template and the tool's injector import them from core; the app's `boot-contract.ts` is deleted. This is what lets a third-party shell template and the tool's injector agree without the tool depending on app code. Minor core changeset.

### D6 — Plugin goes public under the scope, compiled

Rename to `@loom-js/esbuild-plugin-html-split`, drop `private`, add a `build-package` script (rollup, matching `core`'s ES + CJS + `index.d.ts` shape) with `exports` pointing at `dist/`, a README (options, template args, splitting semantics), and a first changeset. Both `@loom-js/build` and the plugin live under `packages/` (`packages/build`, `packages/esbuild-plugin-html-split` — the `packages/esbuild/*` nesting goes). `.prettierrc` `packageJSONFiles` and `pnpm-workspace.yaml` follow.

_Alternative rejected:_ keep the plugin private and fold it into `@loom-js/build` — kills the raw-esbuild path and the standalone plugin docs.

### D7 — App migration is a cut-over, not a shim

`apps/loom` and `apps/sandbox` delete `project/client/{build,dev,config,template.html}.mts`; `prerender.mts` collapses into the four hooks inside `loom.config.ts` (llms-text emission stays as `project/client/llms-text.mts`, called from `after`). Scripts become `loom build` / `loom dev`. No compatibility layer for the old entrypoints — nothing outside this repo used them.

## Risks / Trade-offs

- [The option surface leaks esbuild and later blocks a vite adapter] → every declarative field is bundler-neutral; only `esbuild(options)` names the engine, and it is documented as the escape hatch, not the API.
- [Byte-level output drift during migration breaks the pinned app specs] → task 5 diffs the pre-migration `build/` tree (file list, shell markup, state scripts) against the post-migration one before the old files are deleted.
- [Config bundling via esbuild mis-resolves workspace imports in `loom.config.ts`] → externals are computed from the config's nearest `package.json` deps + `node_modules`; `@loom-js/*` workspace links resolve as externals.
- [`@loom-js/build` publishes before it is proven on an external app] → `0.1.0`, README marks the option surface pre-1.0 (the same posture as `pink`).
- [Core gains a non-rendering export] → the boot contract is five constants and one string function; it sits in its own module and the browser bundle cost is negligible.

## Migration Plan

1. Core: add the boot-contract module and exports (additive).
2. Plugin: rename, compile, publish prep — the apps keep working through the `workspace:*` link.
3. `@loom-js/build`: package, CLI, default template, prerender pipeline; prove on `apps/sandbox` first (no prerender), then `apps/loom`.
4. Capture a baseline `build/` of each app before cut-over; diff after; delete the old `project/client` build files.
5. Changesets; `docs-build-tool-topic` unblocks.

Rollback: the old entrypoints are in git history; reverting the app commit restores them since the plugin keeps the same options.

## Open Questions

None — package name (`@loom-js/build`) and surface (CLI + config) were settled with the maintainer on 2026-10-01.
