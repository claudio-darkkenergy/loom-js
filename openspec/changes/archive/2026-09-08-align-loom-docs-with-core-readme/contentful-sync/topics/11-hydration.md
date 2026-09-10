---
slug: hydration
title: Client Hydration
---
Pre-rendered markup needs a client takeover the reader never sees. This topic covers `hydrate`'s settle-and-swap boot — how it differs from `init`, what gates the swap, and the semantics around it.

## Settle-and-swap

`renderToString` → `hydrate` is the pre-rendering story: the server (or build step) serializes the page (see [Server Rendering](/docs/server-rendering)), & `hydrate` boots the client on top of it **without ever showing a flash**. Where `init` (see [Bootstrapping](/docs/bootstrapping)) mounts the app shell immediately — replacing the root's children by default — then churns again as lazy routes & data land, `hydrate` leaves the pre-rendered DOM untouched while the app renders detached, & performs a **single atomic swap** once the app has _settled_ — lazy route content & async activity work included. Because server & client run the same render path, the swapped-in DOM matches the served markup & the takeover is invisible.

## hydrate

`hydrate(props): Promise<void>` - `init`'s contract minus `placement` (the swap is always a full replace); resolves after the swap & `onAppMounted`.

- `app`, `root`, `globalConfig`, `onAppMounted` - As in `init`.
- `ready?: Promise<unknown>` - Optional caller-owned gate: the swap awaits it alongside settlement. Use it for async work the framework cannot track (see the tracking boundary below).
- `maxWait?: number` - Upper bound in ms (default `4000`) on how long the swap waits. On expiry the swap runs with whatever has rendered & a framework console warning names the still-pending count. `Infinity` disables the bound.

**Inclusion** `import { hydrate } from '@loom-js/core';`

**Quick Example**

```ts
import { hydrate } from '@loom-js/core';

import { App } from '@app/app';

// The root already carries the server-rendered markup.
hydrate({
    app: App(),
    root: document.querySelector('#page-content')
});
```

The example leans on the app having *settled* — and you can import that signal directly.

## settled

`settled(): Promise<void>` - The signal `hydrate` gates on, importable directly: resolves once no framework-mediated async work is pending for the current DOM window, confirmed by one macrotask of continued quiet (so chained lazy work is awaited to quiescence). Useful as a test await point or anywhere "the app is done booting" matters.

In a test, that makes the await itself the synchronization - because the transform's promise is tracked, there's no polling loop and no arbitrary sleep:

```ts
import { expect } from '@esm-bundle/chai';

import { activity, component, init, settled } from '@loom-js/core';

const greeting = activity('', async ({ input: name, update }) => {
    update(await fetchGreeting(name));
});

const Page = component(
    (html) => html`
        <main>${greeting.effect(({ value }) => value)}</main>
    `
);

it('renders the fetched greeting', async () => {
    init({ app: Page(), root: document.body });
    greeting.update('loom');

    // The transform's fetch is still in flight here…
    await settled();

    // …and here the DOM is final.
    expect(document.querySelector('main')?.textContent).to.contain(
        'Hello, loom'
    );
});
```

## The swap

The mechanism behind the invisibility is worth naming precisely. While the served markup sits untouched in the root, `hydrate` renders the app into a *detached* tree — real, live DOM nodes that just aren't attached to the document yet; effects & activity updates land in that tree as they resolve. When the gate opens (settlement, plus `ready` if you passed one), `hydrate` replaces the root's children with the detached tree in a single synchronous DOM call. That's the swap. Three things follow from it:

- **The served markup is discarded, not adopted.** The app you end up interacting with is entirely client-rendered; the server's markup never receives listeners or lifecycle — it exists to be seen (& indexed) before the takeover, nothing more.
- **The swap is the client tree's attachment to the document.** Which is why `onMounted` fires at that moment, & `onAppMounted` right after.
- **The invisibility isn't diffing or patching.** Server & client run the same render path against the same data, so the two trees match — replacing one with the other changes nothing on screen.

## Semantics worth knowing

- **The tracking boundary:** settlement counts every thenable returned by an [activity transform](/docs/activities#transforms-the-async-data-path) — lazy imports, `createRoutes` page imports, async data transforms. That's the idiomatic data path, & it's tracked end-to-end. Async work that never passes through a transform (a raw `fetch` inside a `watch` callback, a `setTimeout`) is invisible to the signal — hand it to `hydrate` via `ready`.
- **Pre-swap inertness:** event listeners attach only to the app, rendering detached — the served DOM never gets any. Anchors still work regardless, because they're real `<a href>` elements: clicking one before the swap triggers an ordinary browser navigation (a full page load) to the target, so a user who clicks early still gets where they were going — just without client-side routing. Anything that needs a framework handler — a `$click` button, an intercepted form — does nothing until the swap; that gap lasts until settlement or at most `maxWait` (4s by default).
- **Lifecycle timing matches real attachment:** `onCreated` & `onRendered` fire during the detached render exactly as under `init`; `onMounted` fires at the swap — the client tree's attachment (see The swap above); `onAppMounted` follows it.
- **An empty root degrades gracefully** (e.g. a dev server without pre-rendered markup): same deferred-swap path, just swapping into an empty root.
- **Non-hydrating apps pay nothing:** `hydrate` tree-shakes out of an `init`-only bundle entirely.
- **Skip the refetch:** by default the hydrating client re-runs the fetches the server already ran. Funnel them through the resource cache & they don't have to — see [Dehydrated State](/docs/dehydrated-state).
