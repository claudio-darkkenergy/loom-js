# @loom-js/build

The loom build tool. One `loom.config.ts` describes the app; `loom build`, `loom dev` and `loom prerender` do the rest: an esbuild bundle with code splitting, one HTML shell per route, static copies, and a prerender phase that writes rendered HTML + dehydrated state per route.

Pre-1.0: the option surface may still change between minor versions.

## Install

```sh
npm i -D @loom-js/build
```

`@loom-js/core` is a peer dependency — the shells carry its boot contract (the app root and state-script slots).

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

```jsonc
// package.json
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
  index.html            shell for /
  docs/index.html       shell for /docs
  static/js/spa.js      the entry bundle (+ shared chunks beside it)
  static/styles/base.css
```

`loom dev` watches, rebuilds and serves `build/` on `server.port` (default 3000) with `index.html` as the fallback for every unknown path.

The entry boots the app onto the shell's root:

```ts
// src/bootstrap.ts
import { APP_ROOT_ID, hydrate } from '@loom-js/core';

import { App } from './app';

hydrate({ app: App(), root: document.getElementById(APP_ROOT_ID) ?? undefined });
```

## TypeScript

Built in. The app's sources, the prerender entry and `loom.config.ts` itself are TypeScript with no loader or `tsx` step: esbuild transpiles them, and `paths` aliases resolve from the nearest `tsconfig.json`. Transpile only — nothing here type-checks. Keep `tsc --noEmit` as a separate script and include `loom.config.ts` in the tsconfig's `include` so it is checked too; the package's typings reference `@types/node`, so `process.env` in the config needs no extra setup.

## Commands

| Command          | What it does                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `loom build`     | Wipes `outDir`, bundles, emits shells and copies. In production mode, runs the prerender phase when configured. |
| `loom dev`       | Development mode: watch + serve with SPA fallback. Never prerenders.                                       |
| `loom prerender` | Re-runs only the prerender phase against the current `outDir` — iterate on hooks without a full rebuild.   |

Options: `--mode development|production`, `--outDir <dir>` (also `LOOM_BUILD_DIR`), `--config <file>`.

**Mode.** `build` and `prerender` are production unless `--mode development` is passed or `NODE_ENV=development`; `dev` is always development. Mode drives everything an app would otherwise set by hand:

| Production                                           | Development                                   |
| ---------------------------------------------------- | --------------------------------------------- |
| minified, no sourcemaps                              | readable, sourcemaps                          |
| route-scoped shells (each links only its own chunks) | one superset shell (dev serves one fallback)  |
| two-pass CSS (one mangle pool for JS + CSS)          | single pass                                   |
| `__DEV__` is `false`                                 | `__DEV__` is `true`                           |

## Config

`defineConfig` takes an object or a function of `{ mode }`. Every field is bundler-neutral.

```ts
export default defineConfig(({ mode }) => ({
    root: '.', // project root; default: the config file's directory
    outDir: 'build', // relative to root; `--outDir` / LOOM_BUILD_DIR override
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
        // template: (args) => '…' replaces the default shell entirely
    },
    server: { port: 9092 },
    prerender: {
        /* see Prerender */
    },
    esbuild: (options, { mode }) => options // escape hatch, applied last
}));
```

### Routes and shells

Each route in `routes` gets a shell at `<route>/index.html` (`/` at the root). In production a shell links only its own route's page chunks plus the shared ones; routes are matched to chunks by name prefix — a chunk belongs to a route when its name starts with that route's scope (`/docs` → `docs-…`; `/` → `pages-…`). Put a route's page modules in a directory of that name so esbuild's chunk names carry it. Route-owned CSS is split into per-route bundles, listed in the inlined `window.__ROUTE_ASSETS__` manifest for the runtime to load on navigation.

### HTML

The default shell is a `<head>` with the title, charset and viewport metas, your `html.head` markup, the stylesheets, the route-assets manifest and the scripts; and a `<body>` carrying `<noscript>`, the app-root slot and the state-script slot. `html.template` receives the plugin's template args (see `@loom-js/esbuild-plugin-html-split`) and replaces the whole thing — keep both slots (`appRootSlot`, `stateScriptSlot` from `@loom-js/core`) or prerendering will refuse the shell.

## Prerender

Configure `prerender` and a production `loom build` renders routes to static HTML with their dehydrated state embedded, so the client boots primed and flash-free.

The hooks receive the prerender bundle — the entry module's exports — so whatever the app needs at build time (a data transport, a page list, a resource key) is something the entry exports and a hook calls. Only `prerenderRoute` is required.

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

```ts
// loom.config.ts
import { defineConfig, type PrerenderBundle } from '@loom-js/build';

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

// Typing the bundle keeps the hooks honest about what the entry exports.
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

The pipeline:

1. `entry` is built as `static/js/prerender.js` in the same bundle as the client, so CSS-module names and the core instance match the shipped app. No shell ever loads it.
2. The bundle is imported from `outDir`; it must export `prerenderRoute(url, window) → { html, state }`.
3. `setup(bundle)` runs once. `routes(bundle)` returns the routes to render.
4. The root shell is preserved as `shell.html` (the SPA fallback), and a section shell beside its own `index.html` when that section route is itself rendered. With `preloadFonts`, every `.woff2` the build emitted is preloaded from the shells.
5. Each route renders against a fresh DOM window (`linkedom`), into the shell of its longest configured route prefix (`/docs/a` → the `/docs` shell). The output is sanity-checked (markup present, state parses), then `validate` runs, then the markup and state are injected and `<route>/index.html` written.
6. `after({ outDir, bundle })` runs once at the end.

Anything thrown by a hook fails the build. `loom prerender` repeats steps 2–6 against the existing output.

## Programmatic use

```ts
import { build, dev, loadConfig, prerender, resolveConfig } from '@loom-js/build';

const { config } = await loadConfig(process.cwd());
const resolved = await resolveConfig(config, { mode: 'production' });

await build(resolved);
```

`createBuildOptions(resolved)` returns the final esbuild options, for a setup that drives esbuild itself.

## Escape hatch

`esbuild(options, { mode })` receives the assembled esbuild options after every tool default and returns what esbuild runs. It is the only place the bundler is named; reach for it when a declarative field does not exist yet.
