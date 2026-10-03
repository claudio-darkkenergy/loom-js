# Outline — `build-tool` topic

Slug `build-tool`, title **Build Tool**. Placement: `/docs` listing, "Reference" group (`zeCgs0CoOud8r4tOF6l3f`), between `diagnostics` and `feedback`. Source of truth: `packages/build/src/` and `packages/esbuild-plugin-html-split/src/types.ts` (pointers per section below; `apps/loom/loom.config.ts` is the reference consumer).

**Lead.** loom ships its own build tool. `@loom-js/build` turns a `loom.config.ts` into a production bundle, one HTML shell per route, and — when asked — prerendered pages with their state embedded; esbuild does the bundling underneath. This topic covers the commands, the config, and the prerender hooks.

## The blessed build

- What one `loom build` produces: `static/js/spa.js` + shared chunks, `static/styles/*`, a shell per route, copies, prerendered `index.html`s.
- **Inclusion** `npm i -D @loom-js/build` · peer `@loom-js/core` (the shells carry its boot contract).
- Pre-1.0 note (option surface may move between minors).
- _Source:_ `package.json` (`bin`, peer), `src/index.ts`.

## Quick start

- Three-field `loom.config.ts` (`entry`, `routes`, `styles`) + `"build": "loom build"` / `"dev": "loom dev"`.
- The emitted `build/` tree.
- The entry boots onto the shell root: `hydrate({ app, root: document.getElementById(APP_ROOT_ID) })` — cross-link [Bootstrapping](/docs/bootstrapping), [Client Hydration](/docs/hydration).
- _Source:_ `src/esbuild-options.ts` (`SPA_ENTRY_NAME`, `STYLES_DIR`, `PUBLIC_DIR_TARGET`), `src/template.ts`.

## Commands

- `loom build` · `loom dev` · `loom prerender` — one line each.
- Flags: `--mode`, `--outDir` (also `LOOM_BUILD_DIR`), `--config`.
- **Mode**: how it resolves (`--mode` > `NODE_ENV=development` > production; `dev` always development) and the production/development table (minify + sourcemaps, scoped vs superset shell, two-pass CSS, `__DEV__`).
- _Source:_ `src/cli.ts`, `src/resolve-config.ts` (`resolveMode`), `src/esbuild-options.ts`.

## Config

- `defineConfig` — object or `({ mode }) => config`; every field bundler-neutral.
- Full annotated example (the README's), then one H3 per thing that needs explaining:
    - ### Routes and shells — one shell per route; route-scoped prod shells; the chunk-prefix convention (`routeScopeOf`: route path, `/` → `pages`) and naming page modules to match; route-owned CSS split into per-route bundles + the inlined `__ROUTE_ASSETS__` manifest.
    - ### HTML — the default shell's anatomy; `title` / `head` / `bodyClass` layering; `template` as full override and the two slots it must keep (`appRootSlot`, `stateScriptSlot`).
    - ### Defines, copies, server — `define` JSON-encoding + tool-owned `__DEV__`; `publicDir` → `<outDir>/static`; `copy`; `server.port` / `host`.
    - ### The `esbuild` escape hatch — applied last; the only bundler-named field.
- _Source:_ `src/config.ts` (types + doc comments), `src/template.ts`, `src/esbuild-options.ts`; plugin `src/route-css.ts` (`routeScopeOf`, CSS ownership).

## Prerendering

- When it runs (production `build` with a `prerender` section; never `dev`; `loom prerender` re-runs the phase alone).
- The entry: built as `static/js/prerender` in the same bundle (why: css-module names + one core instance); must export `prerenderRoute(url, window) → { html, state }` — cross-link [Server Rendering](/docs/server-rendering), [Dehydrated State](/docs/dehydrated-state) for `renderToString` / `dehydrate` / `serializeState`.
- The hooks, one H4-less paragraph each: `setup(bundle)`, `routes(bundle)`, `validate(route, output, bundle)`, `after({ outDir, bundle })`, `preloadFonts`; "the bundle is the entry's exports" — typing it with `defineConfig<Bundle>`.
- The pipeline as a numbered list (shell preservation → fonts → per-route fresh window → sanity checks → `validate` → `injectPrerender` → write → `after`); failure = build fails.
- Shell resolution: longest configured route prefix; `shell.html` as the SPA fallback (and what a host rewrites to it).
- _Source:_ `src/prerender.ts` (`shellRouteOf`, `routeOutputPath`, `ROOT_SHELL_FILE`), `src/config.ts` (`PrerenderOptions`), core `src/boot-contract.ts`; `tests/build.test.mjs` pins the output shape.

## TypeScript

- Transpiled by esbuild (sources, prerender entry, config, `paths` aliases); no type-checking — keep `tsc --noEmit`, include `loom.config.ts`; node types come with the package typings.
- _Source:_ `src/load-config.ts`, `rollup.config.ts` (dts banner).

## Programmatic use

- `loadConfig` → `resolveConfig` → `build` / `dev` / `prerender`; `createBuildOptions` for driving esbuild yourself.
- _Source:_ `src/index.ts`.

## Raw esbuild and other bundlers

- `@loom-js/esbuild-plugin-html-split` standalone: what it is (the shell layer), when to reach for it, pointer to its README for options / template args / chunk classification.
- One line: vite and webpack adapters are planned; the config surface is bundler-neutral so they slot under the same fields.
- _Source:_ plugin `README.md`, `src/types.ts`.

---

Drift obligation (spec `docs-build-tool-coverage`): a consumer-visible change under `packages/build/src/` or the plugin's options/template args updates this topic in the same change. `docs/content-map.md` gets a `build-tool` entry with the pointers above at authoring time.
