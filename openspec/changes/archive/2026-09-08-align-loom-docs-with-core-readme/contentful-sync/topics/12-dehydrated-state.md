---
slug: dehydrated-state
title: Dehydrated State
---
A server-rendered page has already fetched its data; the hydrating client shouldn't pay for it again. This topic covers the dehydrated-state flow — `resource` → `dehydrate` → embed → `primeResources` — end to end.

## Paying for data once

Settle-and-swap [hydration](/docs/hydration) pays for its data twice: the server ran the app's fetches to produce the markup, & the hydrating client re-runs the same fetches to rebuild the same state — with the swap waiting on them. Dehydration closes that gap. Funnel data-loads through the keyed **resource cache**, serialize the server's settled values into the page, & prime the client's cache from them at boot — primed fetches resolve from local data & never hit the network, so hydration settles almost immediately.

The full story: `renderToString` → `dehydrate` → embed → `primeResources` → `hydrate`.

**Inclusion** `import { primeResources, resource } from '@loom-js/core';` · `import { dehydrate, serializeState } from '@loom-js/core/server';`

## API

### `resource`

`resource<T>(key: string, fetcher: () => Promise<T>): Promise<T>` - A keyed async memo, per DOM window — the interception point capture & priming share. The first call per key invokes the fetcher, concurrent callers share the in-flight promise, & later calls resolve from cache without invoking the fetcher again. A rejected fetch rejects its sharing callers & is **not** cached — the next call retries. Call it inside an [async activity transform](/docs/activities#transforms-the-async-data-path) (the idiomatic data path), where the returned promise is already tracked by the settlement signal `hydrate` gates on.

### `primeResources`

`primeResources(state: DehydratedState): void` - Seeds the current window's resource cache from a dehydrated state object: a primed key resolves with the primed value without ever invoking its fetcher; unprimed keys fetch exactly as before. Run it **before the boot call** — transforms run during first render — & ahead of any boot: `hydrate` & `init` benefit identically.

### `dehydrate`

`dehydrate(window): DehydratedState` (server entry) - After `await renderToString(app, { window, url })` (see [Server Rendering](/docs/server-rendering)), returns that window's **settled** resource values as a plain JSON-serializable object. Pending entries (possible when `maxWait`-style drain bounds expire) are skipped; so are unserializable values, with a framework console warning — a skipped key is just a client-side cache miss.

### `serializeState`

`serializeState(state: DehydratedState): string` (server entry) - Serializes the state to a JSON string safe to inline inside an HTML script element: `<`, U+2028 & U+2029 are escaped, & `JSON.parse` reproduces the original state. Hand-rolling `JSON.stringify` into inline HTML is a known XSS footgun (`</script>` smuggled through content) — always embed through this helper.

## Example

Funnel the app's data-loads through `resource` (namespace keys `<domain>:<id>`):

```ts
// Shared app code — the same module the server handler & the client entry
// import; it runs in both. The cache decides what a fetch costs: unprimed
// (server render, or a client-only app) it really fetches; primed it doesn't.
import { activity, resource } from '@loom-js/core';

const page = activity<PageData | undefined, string>(
    undefined,
    async ({ input: slug, update }) => {
        update(await resource(`page:${slug}`, () => fetchPage(slug)));
    }
);

// Dispatches carry the slug: page.update('getting-started')
```

On the server, capture after the render & embed alongside the markup. The transport is explicit — loom never writes or discovers page structure; the documented convention is a JSON script tag. Extending the handler from [Server Rendering](/docs/server-rendering):

```ts
import { readFile } from 'node:fs/promises';

import {
    dehydrate,
    renderToString,
    serializeState
} from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import { App } from '@app/app';

export const handleRequest = async (request: Request) => {
    // One window per render, as always.
    const { window } = parseHTML('<html><body></body></html>');
    const markup = await renderToString(App(), {
        url: request.url,
        window
    });

    // Capture after the render — the cache now holds the settled values.
    const stateScript = `<script type="application/json" id="loom-state">${serializeState(
        dehydrate(window)
    )}</script>`;

    // The same shell file — the state script lands beside the app markup.
    const shellTemplate = await readFile('./shell.html', 'utf8');

    return shellTemplate
        .replace('<!--app-->', markup)
        .replace('</body>', `${stateScript}</body>`);
};
```

On the client, read it back & prime before booting:

```ts
// client.ts — the same browser entry the shell loads as /client.js.
import { hydrate, primeResources } from '@loom-js/core';

import { App } from '@app/app';

const embedded = document.getElementById('loom-state');

embedded && primeResources(JSON.parse(embedded.textContent ?? '{}'));
hydrate({
    app: App(),
    // The shell's app root — the div the server rendered the markup into.
    root: document.querySelector('#page-content')
});
```

That's the whole loop: fetch once on the server, carry it over, boot primed. A few details worth keeping in mind:

## Semantics worth knowing

- **Key namespacing:** all keys share one per-window map — namespace them `<domain>:<id>` (`page:docs/intro`, `cms:nav`). Collisions follow `Map` semantics (last write wins).
- **Window-lifetime cache; freshness lives in the key:** a cached or primed value persists for the window's lifetime, exactly like `lazyImport` — SPA navigation away & back reuses it. Express freshness through keys (include a content version if needed); TTL/invalidation is deliberately not cache semantics loom owns.
- **The serializability boundary:** only JSON-serializable values dehydrate. Anything else (functions, DOM nodes, circular structures, `undefined`) is skipped with a warning — the client simply fetches that key.
- **Graceful everywhere:** a missing, unserializable, or failed entry degrades to a cache miss — the page still works, it just fetches. Fetches not routed through `resource` keep today's behavior exactly; adoption is opt-in & incremental.
- **Bytes:** `resource` & `primeResources` tree-shake out of non-adopting bundles entirely (+171 B min+gzip when adopted); `dehydrate` & `serializeState` live only in the server entry.
