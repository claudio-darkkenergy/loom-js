---
slug: hydration
title: Client Hydration
---
## Settle-and-swap

`renderToString` → `hydrate` is the pre-rendering story: the server (or build step) serializes the page (see [Server Rendering](/docs/server-rendering)), & `hydrate` boots the client on top of it **without ever showing a flash**. Where `init` (see [Bootstrapping](/docs/bootstrapping)) wipes the root to the app shell immediately (then churns again as lazy routes & data land), `hydrate` leaves the pre-rendered DOM untouched while the app renders detached, & performs a **single atomic swap** once the app has _settled_ — lazy route content & async activity work included. Because server & client run the same render path, the swapped-in DOM matches the served markup & the takeover is invisible.

## hydrate

`hydrate(props): Promise<void>` - `init`'s contract minus `placement` (the swap is always a full replace); resolves after the swap & `onAppMounted`.

- `app`, `root`, `globalConfig`, `onAppMounted` - As in `init`.
- `ready?: Promise<unknown>` - Optional caller-owned gate: the swap awaits it alongside settlement. Use it for async work the framework cannot track (see the tracking boundary below).
- `maxWait?: number` - Upper bound in ms (default `4000`) on how long the swap waits. On expiry the swap runs with whatever has rendered & a `loom.console` warning names the still-pending count. `Infinity` disables the bound.

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

## settled

`settled(): Promise<void>` - The signal `hydrate` gates on, exported on its own: resolves once no framework-mediated async work is pending for the current window, confirmed by one macrotask of continued quiet (so chained lazy work is awaited to quiescence). Useful as a test await point or anywhere "the app is done booting" matters.

## Semantics worth knowing

- **The tracking boundary:** settlement counts every thenable returned by an [activity transform](/docs/activities#transforms-the-async-data-path) — lazy imports, `createRoutes` page imports, async data transforms. That's the idiomatic data path, & it's tracked end-to-end. Async work that never passes through a transform (a raw `fetch` inside a `watch` callback, a `setTimeout`) is invisible to the signal — hand it to `hydrate` via `ready`.
- **Pre-swap inertness:** the server DOM receives no listeners before the swap. Native anchors still navigate (a full page load — graceful pre-interactive degradation); other interaction is inert for the short, bounded settle window.
- **Lifecycle timing matches real attachment:** `onCreated` & `onRendered` fire during the detached render exactly as under `init`; `onMounted` fires at the swap, `onAppMounted` after it.
- **An empty root degrades gracefully** (e.g. a dev server without pre-rendered markup): same deferred-swap path, just swapping into an empty root.
- **Non-hydrating apps pay nothing:** `hydrate` tree-shakes out of an `init`-only bundle entirely.
- **Skip the refetch:** by default the hydrating client re-runs the fetches the server already ran. Route them through the resource cache & they don't have to — see [Dehydrated State](/docs/dehydrated-state).
