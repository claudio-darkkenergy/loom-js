---
slug: server-rendering
title: Server Rendering
---
Pages don't have to start in the browser: loom can serialize an app to HTML on a server or at build time. This topic covers `renderToString` (async, the go-to), its synchronous sibling `renderToStringSync`, and what makes off-browser rendering safe.

## Rendering off-browser

`renderToString` renders an app to an HTML string outside the browser — at request time (SSR) or build time (SSG/prerender). It runs the **exact same render path** the client does, against an injected DOM implementation, so server and client markup cannot drift. loom never imports the DOM implementation itself; you supply a DOM window (we recommend [linkedom](https://github.com/WebReflection/linkedom) — small, fast, purpose-built for this).

**Inclusion** `import { renderToString } from '@loom-js/core/server';`

## renderToString

`renderToString(app: ContextFunction, options)` - The go-to render (async). Renders `app` against the injected DOM, waits on the settlement signal (`settled()`) — so `createRoutes` route pages, `lazyImport` content & async activity data serialize in place, however long they take — & resolves the document body's `innerHTML`. Concurrent calls are safely serialized internally.

- `options.window` - The DOM to render against, e.g. `parseHTML(...).window` from linkedom. Use a fresh window per render — never share one across concurrent renders.
- `options.url?: string` - The request URL. Installed as the window's `location`, so `locationEffect` & `createRoutes` match the requested path.
- `options.maxWait?: number` - Upper bound in ms (default `4000`) on the settlement wait — symmetric with `hydrate`'s `maxWait`. On expiry the render serializes whatever has landed & a framework console warning names the still-pending count. `Infinity` disables the bound. Ignored by `renderToStringSync`.

**Quick Example**

```ts
import { readFile } from 'node:fs/promises';

import { renderToString } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import { App } from '@app/app';

export const handleRequest = async (request: Request) => {
    // One window per render (per request, or per page when prerendering).
    const { window } = parseHTML('<html><body></body></html>');
    const markup = await renderToString(App(), {
        url: request.url,
        window
    });

    // Inject the markup into your HTML shell however you like — here, a
    // served shell file carrying an <!--app--> placeholder.
    const shellTemplate = await readFile('./shell.html', 'utf8');

    return shellTemplate.replace('<!--app-->', markup);
};
```

The shell is an ordinary HTML file you own — the placeholder marks where the app lands, and the script tag loads the same client bundle that will take the page over:

```html
<!doctype html>
<html>
    <head>
        <title>My app</title>
        <script defer src="/client.js" type="module"></script>
    </head>
    <body>
        <div id="page-content"><!--app--></div>
    </body>
</html>
```

`handleRequest` is fetch-shaped, so it wires into any modern server runtime — a serverless function, a framework that speaks `Request`/`Response` (Hono, SvelteKit-style adapters), or Node's `http` via a small adapter. And the client entry — a separate, browser-only module — boots on top of the served markup:

```ts
// client.ts — the browser entry `/client.js` is bundled from. Note the
// import arrows: this module and the server handler both import the shared
// `@app/app` component module (import-safe off-browser, no DOM at module
// scope); neither imports the other. Only the shell's script tag loads this
// file, in the browser — where `document` is the native global, the real
// page parsed from the HTML the server sent.
import { hydrate } from '@loom-js/core';

import { App } from '@app/app';

hydrate({ app: App(), root: document.querySelector('#page-content') });
```

The full loop, then: serve `handleRequest`'s HTML, and `/client.js` takes it over — keeping top-level `document` access in the browser-only entry, never in modules the server imports — `hydrate`'s own semantics (the settle-and-swap, its gates) are [Client Hydration](/docs/hydration)'s subject.

That's the go-to path — settlement-gated, so async content serializes in place. Sometimes you don't want to wait at all.

## renderToStringSync

`renderToStringSync(app: ContextFunction, options)` - The synchronous primitive: whatever has rendered when the app's synchronous work completes is what serializes (the naming follows Node's `readFile`/`readFileSync` pairing). Right for route-less renders — fragments, email/OG markup, component snapshot tests. A route-table app serializes only its shell/fallback here, since page importers cannot settle inside a synchronous pass. Same `options`.

## Choosing a DOM implementation

Any window-shaped DOM implementation can back a server render — loom touches only standard surface (document parsing, `importNode`, tree walking, per-window `customElements`). **linkedom stays the recommendation**: small, fast, and purpose-built for exactly this. [jsdom](https://github.com/jsdom/jsdom) is also verified — heavier, but the most spec-complete, and a natural fit when your server tests already run on it:

```ts
import { JSDOM } from 'jsdom';

export const handleRequest = async (request: Request) => {
    // Only the window creation changes — one fresh window per render,
    // same contract as linkedom.
    const { window } = new JSDOM('<html><body></body></html>');

    // …the rest is identical to the linkedom handler above.
};
```

Two honest boundaries:

- [Happy DOM](https://github.com/capricorn86/happy-dom) does not work today — its strict attribute validation trips a known loom bug (tracked; support is planned).
- Pick **one implementation per process**: parsed templates cache against the first render's document, so mixing implementations in a single process hands one library's nodes to another's APIs.

## Semantics worth knowing

- `renderToString` gates on the same settlement signal `hydrate` does: framework-tracked async work ([async activity transforms](/docs/activities#transforms-the-async-data-path), route pages, lazy imports) serializes; async work outside a transform (a raw `fetch` in a `watch` callback, a `setTimeout`) is invisible to the signal & belongs to the client — boot it with `hydrate` (see [Client Hydration](/docs/hydration)) to make the takeover invisible.
- `onCreated`, `onBeforeRender` & `onRendered` fire as usual; `onMounted` & `onUnmounted` never fire on the server — they describe a live, observed browser document (see [Components](/docs/components)).
- Custom elements need no server-side wiring: each injected window has its own `customElements` registry, so core replays every `defineElement` registration into it automatically — including registrations made at module scope, before any window existed.
- Importing `@loom-js/core` off-browser is safe - browser-coupled state (router location, history listeners) initializes lazily on first use.
- Nothing extra ships to the browser: the server entry is a separate export, & the server-side DOM implementation (e.g. linkedom) is your dependency, not loom's.

## Prerendering (SSG)

Prerendering an app at build time runs through `renderToString` — one render per page, against a fresh injected window:

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { renderToString } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import { App } from '@app/app';

// Enumeration is yours: loom renders URLs, it doesn't discover them. List
// every page — from your route table, a CMS listing, or the filesystem.
const routes = ['/', '/docs/intro', '/docs/activities'];

// The bundler's emitted shell already links the hashed client bundle, so
// reusing it keeps scripts & styles wired without hand-maintenance.
const shell = await readFile('./dist/index.html', 'utf8');

for (const route of routes) {
    // A fresh window per page — renders must not share state.
    const { window } = parseHTML('<html><body></body></html>');
    // Render the same App the browser boots: the router matches `url`,
    // imports that route's page, & settlement holds the render until the
    // page's tracked content lands.
    const markup = await renderToString(App(), {
        url: `https://example.com${route}`,
        window
    });
    const outDir = path.join('./dist', route);

    await mkdir(outDir, { recursive: true });
    await writeFile(
        path.join(outDir, 'index.html'),
        shell.replace('<!--app-->', markup)
    );
}
```

Serve `./dist` statically and every listed route is a real page. Two notes close the loop: an app *without* a route table prerenders the same way by rendering the page component directly with its data (`renderToString(Page(content), …)` — the shape the App Initialization example shows); and each emitted page boots through the same `hydrate` entry as the SSR shell above — with [Dehydrated State](/docs/dehydrated-state) carrying the build-time data so hydration never refetches.
