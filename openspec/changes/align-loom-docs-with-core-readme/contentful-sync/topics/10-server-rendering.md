---
slug: server-rendering
title: Server Rendering
---
## Rendering off-browser

`renderToString` renders an app to an HTML string outside the browser — at request time (SSR) or build time (SSG/prerender). It runs the **exact same render path** the client does, against an injected DOM implementation, so server and client markup cannot drift. loom never imports the DOM implementation itself; you supply a window (we recommend [linkedom](https://github.com/WebReflection/linkedom) — small, fast, purpose-built for this).

**Inclusion** `import { renderToString } from '@loom-js/core/server';`

## renderToString

`renderToString(app: ContextFunction, options)` - The go-to render (async). Renders `app` against the injected DOM, waits on the settlement signal (`settled()`) — so `createRoutes` route pages, `lazyImport` content & async activity data serialize in place, however long they take — & resolves the document body's `innerHTML`. Concurrent calls are safely serialized internally.

- `options.window` - The DOM to render against, e.g. `parseHTML(...).window` from linkedom. Use a fresh window per render — never share one across concurrent renders.
- `options.url?: string` - The request URL. Installed as the window's `location`, so `locationEffect` & `createRoutes` match the requested path.
- `options.maxWait?: number` - Upper bound in ms (default `4000`) on the settlement wait — symmetric with `hydrate`'s `maxWait`. On expiry the render serializes whatever has landed & a `loom.console` warning names the still-pending count. `Infinity` disables the bound. Ignored by `renderToStringSync`.

**Quick Example**

```ts
import { renderToString } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import { App } from '@app/app';

// One window per render (per request, or per page when prerendering).
const { window } = parseHTML('<html><body></body></html>');
const markup = await renderToString(App(), {
    url: request.url,
    window
});

// Inject the markup into your HTML shell however you like.
const html = shellTemplate.replace('<!--app-->', markup);
```

## renderToStringSync

`renderToStringSync(app: ContextFunction, options)` - The synchronous primitive: whatever has rendered when the app's synchronous work completes is what serializes (the naming follows Node's `readFile`/`readFileSync` pairing). Right for route-less renders — fragments, email/OG markup, component snapshot tests. A route-table app serializes only its shell/fallback here, since page importers cannot settle inside a synchronous pass. Same `options`.

## Semantics worth knowing

- `renderToString` gates on the same settlement signal `hydrate` does: framework-tracked async work ([async activity transforms](/docs/activities#transforms-the-async-data-path), route pages, lazy imports) serializes; async work outside a transform (a raw `fetch` in a `watch` callback, a `setTimeout`) is invisible to the signal & belongs to the client — boot it with `hydrate` (see [Client Hydration](/docs/hydration)) to make the takeover invisible.
- `onCreated`, `onBeforeRender` & `onRendered` fire as usual; `onMounted` & `onUnmounted` never fire on the server — they describe a live, observed browser document (see [Components](/docs/components)).
- Custom elements registered via `defineElement` are applied to each injected window automatically.
- Importing `@loom-js/core` off-browser is safe - browser-coupled state (router location, history listeners) initializes lazily on first use.
- Nothing extra ships to the browser: the server entry is a separate export, & linkedom is your dependency, not loom's.

## Prerendering (SSG)

Prerendering an app at build time runs through `renderToString` — one render per page, against a fresh injected window:

```ts
import { renderToString } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import content from './content.json';
import { Page } from './page';

const { window } = parseHTML('<html><body></body></html>');
const markup = await renderToString(Page(content), {
    url: 'https://example.com/docs/intro',
    window
});
// Write `markup` into your HTML shell & emit the file.
```

The client half of the story is [Client Hydration](/docs/hydration); to hand the server's fetched data to the client so hydration never refetches, see [Dehydrated State](/docs/dehydrated-state).
