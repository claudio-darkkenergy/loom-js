# @loom-js/esbuild-plugin-html-split

An esbuild plugin that emits one HTML shell per route (or per entry point) from a template that sees the build's metafile: which chunks are shared, which belong to a route, which are only reached by `import()`, and which CSS each route owns.

It is the shell layer under [`@loom-js/build`](../build). Use it directly when you run esbuild yourself.

## Install

```sh
npm i -D @loom-js/esbuild-plugin-html-split esbuild
```

`esbuild` is a peer dependency (`>=0.25`).

## Usage

```ts
import { htmlSplit } from '@loom-js/esbuild-plugin-html-split';
import { build } from 'esbuild';

await build({
    bundle: true,
    entryPoints: { 'static/js/spa': './src/bootstrap.ts' },
    format: 'esm',
    outdir: './build',
    splitting: true,
    plugins: [
        htmlSplit({
            entryPoints: ['static/js/spa'],
            isProd: true,
            routes: ['/', '/docs'],
            spa: 'static/js/spa',
            template: ({ common, css, js, routeAssets, routeCss, scope }) => `
<!DOCTYPE html>
<html>
<head>
${common.css
    .concat(css)
    .concat(routeCss)
    .map((href) => `    <link href="${href}" rel="stylesheet" />`)
    .join('\n')}
    <script>window.__ROUTE_ASSETS__ = ${JSON.stringify(routeAssets)}</script>
${common.js
    .concat(js)
    .map((src) => `    <script defer src="${src}" type="module"></script>`)
    .join('\n')}
</head>
<body><div id="app"></div></body>
</html>`
        })
    ]
});
```

Emits `build/index.html` and `build/docs/index.html`. The plugin turns `metafile` on for the build it is attached to. Paths resolve against `absWorkingDir` (or `process.cwd()`); `outdir` may be relative or absolute, inside or outside the project.

## Modes

**SPA mode** — `spa` + `routes`. One entry point boots every route; one shell is written per route (`/` → `index.html`, `/docs` → `docs/index.html`). Route page chunks are expected to be named with the route's scope prefix (see [Route scopes](#route-scopes)).

**Multi-entry mode** — neither `spa` nor `routes`. One shell per JS entry point, at `<entry basename>/index.html`; the entry named `index` (or `main`) lands at the outdir root.

## Options

| Option        | Type                                 | Default       | Notes                                                                                                                                              |
| ------------- | ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes`      | `string[]`                           | `[]`          | SPA mode: the routes to emit a shell for.                                                                                                          |
| `spa`         | `string`                             | `''`          | SPA mode: the entry point's output name (`static/js/spa`).                                                                                         |
| `entryPoints` | `string[]`                           | —             | Output names to treat as entry points. With `spa`, name the SPA entry here so route chunks classify as common/dynamic resources, not extra shells. |
| `isProd`      | `boolean`                            | `false`       | Scoped shells link their own route CSS (`routeCss`). Dev shells leave it to the runtime loader.                                                    |
| `template`    | `(args: HtmlTemplateArgs) => string` | minimal shell | The shell template. See [Template args](#template-args).                                                                                           |
| `define`      | `Record<string, any>`                | `{}`          | Passed through to the template as `args.define`.                                                                                                   |
| `twoPassCss`  | `boolean`                            | `false`       | Rebuild once so JS and CSS share one identifier-mangle pool. Required for `minify: true` with CSS modules.                                         |
| `main`        | `string`                             | `'index'`     | Multi-entry mode: the entry whose shell is the root `index.html`.                                                                                  |
| `verbose`     | `boolean`                            | `false`       | Log the scoped build options and the template args.                                                                                                |

## Template args

Every path is site-absolute (`/static/js/spa-ABC123.js`) — the esbuild `outdir` prefix is stripped.

| Field         | What it holds                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `js`          | The entry-point bundle(s) this shell boots.                                                                     |
| `css`         | The entry stylesheet(s) — shared CSS only once route CSS has been split out.                                    |
| `common.js`   | Chunks shared across shells: neither an entry point nor a dynamic-import target.                                |
| `common.css`  | CSS bundles that belong to no entry point.                                                                      |
| `dynamic.js`  | Chunks only reached through `import()`. Not script-tagged by default — see below.                               |
| `routeCss`    | CSS bundles owned by this shell's route. Populated in prod only.                                                |
| `routeAssets` | Manifest `route -> CSS bundle URLs` for every route. Inline it for a runtime loader to fetch on SPA navigation. |
| `scope`       | This shell's route scope (`routeScopeOf(route)`), or the entry basename in multi-entry mode.                    |
| `define`      | The `define` option.                                                                                            |

## Chunk classification

The plugin reads esbuild's metafile after each build and sorts every output:

1. **Dynamic chunks** — any output that is the target of a `dynamic-import` edge from another output. esbuild marks these as entry points too, so they are detected by the edge, not the flag. They land in `dynamic.js`. A template should only script-tag the ones it knows are safe to evaluate eagerly (typically route page chunks, as a preload); anything else — a grammar module, a lazily sequenced dependency — must stay with its importer's `import()`.
2. **Dynamic-chunk CSS** — a dynamic chunk's `cssBundle` is dropped: esbuild does not code-split CSS, so its rules already live in the importing entry's stylesheet.
3. **Entry points** — `entryPoints` / `spa` matches go to `js` / `css`.
4. **Everything else** — `common.js` / `common.css`.

### Route scopes

In SPA mode each route's page chunks are recognised by name prefix: a chunk belongs to a route when its basename starts with `routeScopeOf(route).slice(1) + '-'`. `routeScopeOf` is exported: it is the route path, except `/` maps to `/pages`. Name your route page modules so esbuild's chunk names carry that prefix (e.g. a `pages/` directory for the home route, a `docs/` directory for `/docs`).

### Route CSS

CSS ownership is decided from the metafile's import graph. A CSS input is owned by a route when every importer, followed through `@import` chains, lives in that route's JS subgraph; anything else is shared and stays in the entry stylesheet. Then:

- **Single-pass** (default) — the entry stylesheet is rewritten to shared-only and each route bundle to owned-only through nested builds. CSS-module class names must be build-stable, so the parent build must not minify identifiers; the plugin throws if it does, pointing at `twoPassCss`.
- **Two-pass** (`twoPassCss: true`) — the whole build reruns once with synthetic shared and per-route CSS entries, so one mangle pool names the JS and every stylesheet. Full `minify` stays sound. Route bundles are content-hashed; shells emit from pass two's outputs.

Either way the result is the `routeAssets` manifest plus `routeCss` for the shell's own route.

## Output

- A shell per route (SPA) or per entry (multi-entry), written under `outdir`.
- Watch-mode rebuilds rewrite the shells each time; the per-file log prints only when the output set is new.
