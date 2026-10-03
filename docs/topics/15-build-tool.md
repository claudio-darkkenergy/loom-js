---
slug: build-tool
title: Build Tool
---
loom ships its own build tool. `@loom-js/build` turns a `loom.config.ts` into a production bundle, one HTML shell per route, and — when asked — prerendered pages with their state embedded; esbuild does the bundling underneath. This topic covers the commands, the config, and the prerender hooks.

## The blessed build

One `loom build` produces everything a loom app needs to be served statically: the entry bundle and its code-split chunks under `static/js/`, each standalone stylesheet under `static/styles/`, an `index.html` shell per route, your static files copied across, and — with a `prerender` section — a rendered `index.html` per page carrying its [dehydrated state](/docs/dehydrated-state). The pieces the tool assembles are all things you could wire by hand (the [Server Rendering](/docs/server-rendering) topic shows the prerender loop in forty lines); the tool exists so no app has to.

**Inclusion** `npm i -D @loom-js/build` — `@loom-js/core` is a peer dependency, because the shells carry its boot contract.

`@loom-js/build` is pre-1.0: the option surface may move between minor versions.

## Quick start

```ts
// loom.config.ts
import { defineConfig } from '@loom-js/build';

export default defineConfig({
    entry: './src/bootstrap.ts',
    routes: ['/', '/docs'],
    styles: ['./public/styles/base.css']
});
```

```json
{
    "scripts": {
        "build": "loom build",
        "dev": "loom dev"
    }
}
```

`loom build` emits to `build/`:

```
build/
  index.html             shell for /
  docs/index.html        shell for /docs
  static/js/spa.js       the entry bundle (+ shared chunks beside it)
  static/styles/base.css
```

`loom dev` watches, rebuilds and serves `build/` with `index.html` as the fallback for every unknown path, so client-side routes deep-link in dev.

The shell owns the app root — the entry boots onto it rather than creating one:

```ts
// src/bootstrap.ts
import { APP_ROOT_ID, hydrate } from '@loom-js/core';

import { App } from './app';

hydrate({ app: App(), root: document.getElementById(APP_ROOT_ID) ?? undefined });
```

`hydrate` and `init` both work here — see [Bootstrapping](/docs/bootstrapping) and [Client Hydration](/docs/hydration). A prerendered page needs `hydrate`; an empty shell mounts either way.

## Commands

| Command | What it does |
| --- | --- |
| `loom build` | Wipes `outDir`, bundles, emits the shells and copies. In production mode, runs the prerender phase when one is configured. |
| `loom dev` | Development mode: watch and serve with SPA fallback. Never prerenders. |
| `loom prerender` | Re-runs only the prerender phase against the current `outDir` — iterate on hooks without a full rebuild. |

Flags: `--mode development|production`, `--outDir <dir>` (also the `LOOM_BUILD_DIR` environment variable), `--config <file>`.

**Mode** is the one switch the tool keys everything off. `build` and `prerender` are production unless `--mode development` is passed or `NODE_ENV=development` is set; `dev` is always development. An app never sets minification or sourcemaps by hand:

| Production | Development |
| --- | --- |
| minified, no sourcemaps | readable, sourcemaps |
| route-scoped shells — each links only its own chunks | one superset shell — dev serves a single fallback |
| two-pass CSS (one mangle pool for JS and CSS) | single pass |
| `__DEV__` is `false` | `__DEV__` is `true` |

## Config

`defineConfig` takes a config object, or a function of `{ mode }` for anything that differs between development and production. Every field is bundler-neutral; `esbuild` is the only one that names the engine.

```ts
import { defineConfig } from '@loom-js/build';

export default defineConfig(({ mode }) => ({
    root: '.', // project root; default: the config file's directory
    outDir: 'build', // relative to root; `--outDir` / LOOM_BUILD_DIR override it
    entry: './src/bootstrap.ts', // → static/js/spa.js
    styles: ['./public/styles/base.css'], // → static/styles/<basename>.css
    routes: ['/', '/docs'], // one shell each; default ['/']
    define: { __API_URL__: process.env.API_URL ?? '' }, // JSON-encoded
    publicDir: './public/static', // copied to <outDir>/static
    copy: [{ from: './mocks/**/*', to: './mocks' }], // extra copies, `to` relative to outDir
    html: {
        title: (scope) => (scope === '/docs' ? 'Docs' : 'Home'),
        head: () => '<link rel="dns-prefetch" href="https://api.example" />',
        bodyClass: 'theme-dark'
    },
    server: { port: 9092 },
    prerender: {
        /* see Prerendering */
    },
    esbuild: (options) => options // escape hatch, applied last
}));
```

### Routes and shells

Each route in `routes` gets a shell at `<route>/index.html` (`/` at the root). In production a shell links only its own route's page chunks plus the shared ones, and routes are matched to chunks by name: a chunk belongs to a route when its name starts with that route's scope — `/docs` → `docs-…`, and `/` → `pages-…` by convention (`routeScopeOf`, exported by the plugin). Put a route's page modules in a directory of that name so the bundler's chunk names carry it; a route whose pages are imported statically simply has no route chunks, and that is fine.

CSS follows the same split. A stylesheet owned by one route's modules is cut into a per-route bundle; anything shared stays in the entry stylesheet. Each prod shell links its own route's CSS, and the inlined `window.__ROUTE_ASSETS__` manifest lists every route's bundles for [`createRoutes`](/docs/routing) to load on navigation.

### HTML

The default shell is a `<head>` with the title, charset and viewport metas, your `html.head` markup, the stylesheets, the route-assets manifest and the scripts, then a `<body>` carrying a `<noscript>` notice, the app-root slot and the state-script slot. Three fields adjust it without replacing it: `title(scope)` per shell, `head(args)` for extra markup at the top of the head, `bodyClass` for a class the prerendered markup needs before the boot runs. `template(args)` replaces the whole thing — it receives the plugin's template args (the classified chunks, the route CSS, the manifest) and must keep both slots, `appRootSlot` and `stateScriptSlot` from `@loom-js/core`, or the prerender phase refuses the shell.

### Defines, copies, server

`define` values are JSON-encoded into the bundle, so strings, numbers and booleans all read back as themselves; the tool adds `__DEV__` from the mode. `publicDir` is copied verbatim to `<outDir>/static`; `copy` takes extra `{ from, to }` pairs, `from` a glob relative to the root and `to` a directory relative to `outDir`. `server.port` (default `3000`) and `server.host` configure `loom dev`.

### The `esbuild` escape hatch

`esbuild(options, { mode })` receives the assembled esbuild options after every tool default and returns what esbuild runs. It is the one place the bundler is named; reach for it when a declarative field does not exist yet, and expect it to be the thing that changes if the engine ever does.

## Prerendering

Configure `prerender` and a production `loom build` renders routes to static HTML with their dehydrated state embedded, so the client boots primed and flash-free. `loom dev` never runs it; `loom prerender` runs only this phase against an existing `outDir`.

The phase has two halves. Yours is a **prerender entry** — a module built as `static/js/prerender` in the same bundle as the client, so CSS-module class names and the core instance match the shipped app (no shell ever loads it). It must export one function, `prerenderRoute(url, window)`, which is the [`renderToString`](/docs/server-rendering) + [`dehydrate`](/docs/dehydrated-state) pair from those topics; anything else it exports is for your hooks:

```ts
// src/prerender.entry.ts
import { dehydrate, renderToString, serializeState } from '@loom-js/core/server';

import { App } from './app';
import { setApiToken } from './data';

// Build-time data access: point the app's data layer at the real API.
export const configureTransport = (token: string) => setApiToken(token);

// Route enumeration from the data source.
export const listPages = async (): Promise<string[]> => fetchPageSlugs();

// The one required export.
export const prerenderRoute = async (url: string, window: object) => {
    const html = await renderToString(App(), { url, window });

    return { html, state: serializeState(dehydrate(window)) };
};
```

The tool's half is the pipeline, steered by hooks in the config. Each hook receives the bundle — the entry's exports — so type it to keep the hooks honest:

```ts
// loom.config.ts
import { defineConfig, type PrerenderBundle } from '@loom-js/build';

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

interface Bundle extends PrerenderBundle {
    configureTransport: (token: string) => void;
    listPages: () => Promise<string[]>;
}

export default defineConfig<Bundle>({
    entry: './src/bootstrap.ts',
    routes: ['/', '/docs'],
    prerender: {
        entry: './src/prerender.entry.ts',
        setup: (bundle) => bundle.configureTransport(process.env.TOKEN ?? ''),
        routes: async (bundle) => ['/', ...(await bundle.listPages())],
        validate: (route, { html }) => {
            if (!html.includes('<main')) throw new Error(`${route} rendered no main`);
        },
        after: ({ outDir }) =>
            writeFile(path.join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /'),
        preloadFonts: true
    }
});
```

- `setup(bundle)` runs once before anything renders — point data providers at their build-time transport, read a token, seed a cache.
- `routes(bundle)` returns the routes to render. Enumeration is yours, as it is in the hand-rolled loop: a route table, a CMS listing, the filesystem.
- `validate(route, { html, state }, bundle)` throws to fail the build for a route whose output is not what the app expects — a missing title, a resource key absent from the state.
- `after({ outDir, bundle })` runs once after every route is written — sitemaps, feeds, anything derived from the same data.
- `preloadFonts` preloads every `.woff2` the build emitted from the shells' `<head>`; fonts are otherwise only discoverable through CSS `url()`s, which puts their download after first paint.

What the pipeline does with them:

1. Imports the bundle from `outDir` and checks for `prerenderRoute`.
2. Runs `setup`, then `routes`.
3. Preserves the pristine shells: the root shell is copied to `shell.html` (the SPA fallback a host rewrites unknown paths to), and a section's shell beside its own `index.html` when that section route is itself rendered. Font preloads go into the shells here.
4. Renders each route against a fresh DOM window into the shell of its longest configured route prefix — `/docs/a` uses the `/docs` shell. The output is sanity-checked (markup present, state parses), `validate` runs, then `injectPrerender` fills the two slots and `<route>/index.html` is written.
5. Runs `after`.

Anything a hook throws fails the build. A route whose data never lands is not an error on its own — `renderToString` serializes what has settled and warns — so `validate` is where you turn "the title must be in the markup" or "this key must be in the state" into a failed build rather than a shipped skeleton. The result is the page shape [Client Hydration](/docs/hydration) expects: markup in the app root, state in the script slot, and a boot that primes then hydrates.

## TypeScript

Built in. The app's sources, the prerender entry and `loom.config.ts` itself are TypeScript with no loader step: esbuild transpiles them, and `paths` aliases resolve from the nearest `tsconfig.json`. Transpile only, though — nothing here type-checks. Keep `tsc --noEmit` as a separate script, include `loom.config.ts` in the tsconfig's `include` so it is checked too, and note that the package's typings reference `@types/node`, so `process.env` in the config needs no extra setup.

## Programmatic use

The CLI is a thin layer over exported functions, for a setup that scripts its own build:

```ts
import { build, loadConfig, prerender, resolveConfig } from '@loom-js/build';

const { config } = await loadConfig(process.cwd());
const resolved = await resolveConfig(config, { mode: 'production' });

await build(resolved);
```

`dev(resolved)` starts the dev server; `prerender(resolved)` runs the phase alone; `createBuildOptions(resolved)` returns the final esbuild options for a build that drives esbuild itself.

## Raw esbuild and other bundlers

The shell layer under the tool is its own package, `@loom-js/esbuild-plugin-html-split`: an esbuild plugin that reads the build's metafile and emits one shell per route from a template that sees which chunks are shared, which belong to a route, which are only reached by `import()`, and which CSS each route owns. If you already run esbuild yourself, use it directly — the plugin's README documents its options, the template args and the chunk-classification rules — and the prerender loop in [Server Rendering](/docs/server-rendering) covers the rest.

Adapters for vite and webpack are planned. The config surface above is deliberately bundler-neutral so they can sit under the same fields.
