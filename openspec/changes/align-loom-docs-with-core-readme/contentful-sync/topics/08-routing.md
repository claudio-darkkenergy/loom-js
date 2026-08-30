---
slug: routing
title: Routing
---
## The two-layer pipeline

Routing is used specifically for single-page-apps (SPA). You can still set up server-side routes as you would for a multi-page app, and then let the client-side routing take over to achieve a snappy single-page-app experience. This approach would also work well when prerendering a static site or JAMStack architecture.

The routing system is one layered pipeline per window, built on the [activity](/docs/activities) system and the browser's native History API. Every navigation flows through a raw **location** layer (always fires, no configuration needed), whose match transform feeds the **route** layer (fires when a registered route matches):

- **Layer 1 — location**: zero-config reactivity to the raw `Location` — `locationEffect`, `watchLocation`.
- **Layer 2 — routes**: route-table matching with lazy-loaded pages — `createRoutes`, `routeEffect`, `watchRoute`.

In the browser there is exactly one router for the lifetime of the page; on a server each injected window resolves its own isolated instance (see [Server Rendering](/docs/server-rendering)).

**Inclusion** `import { createRoutes, locationEffect, route } from '@loom-js/core';`

## API

### `createRoutes`

`createRoutes({ config, fallback, guard })` - Registers the app's route table & returns the routes component to compose into your layout tree. Each `config` entry maps a route path (dynamic segments via `/:param`) to an importer of the page component — `() => import('@app/pages/about')`, matched on the module's default export. Route pages load through the same machinery as [Lazy Imports](/docs/lazy-imports).

- DOM-free at call time: calling it at module scope is safe in any runtime, including off-browser. History wiring defers to first use inside a DOM scope.
- Calling it again replaces the route table — last call wins (a call without `guard` clears any registered one).
- `fallback?: () => Promise<ContextFunction | undefined>` - Rendered while no page has loaded.
- `guard?: (routeValue: RouteValue) => boolean` - A synchronous predicate run on every valid match with the candidate `RouteValue` (`matchedRoute`, `params`, `pathname`, `raw`), before the route emission. Returning `false` suppresses the emission — route effects & watchers don't fire & the page content stays put (the `fallback` on first load) — while the raw location layer (layer 1) still observes the navigation. See the guard semantics below.

### `route`

`route(event, options?)` - The click-handler for SPA navigation; wraps `history.pushState`. Modified activations (ctrl/cmd/shift/alt-click) & events another handler already consumed fall through to the browser.

- `event` - Pass the click event through (`route` directly as the handler, or `(e) => route(e, options)`); pass `null` when navigating programmatically via `options.href`.
- `options.href?: string` - The target url - overrides the anchor's href attribute.
- `options.replace?: boolean` - Uses `replaceState` so the address bar updates without adding a history entry.

### `routeEffect` / `watchRoute`

- `routeEffect(routeEffectCallback)` - An effect over the matched route. The callback receives `{ value: RouteValue }` — `matchedRoute`, `params`, `pathname` & `raw` (the `Location`) — & must return a `ContextFunction`. Requires a registered route table.
- `watchRoute(handler)` - The non-rendering watcher form of `routeEffect`; returns an unsubscriber.

### `locationEffect` / `watchLocation`

- `locationEffect(locationEffectCallback)` - An effect over the raw `Location`. Zero-config — no route table required — & re-runs on every navigation. The callback receives `{ value: Location }` & must return a `ContextFunction`.
- `watchLocation(handler)` - The non-rendering watcher form of `locationEffect`; returns an unsubscriber.

### `redirect`

`redirect(href)` - Programmatic replace-state navigation.

### `RouteLink`

A pre-wired SPA anchor — see [Element components](/docs/element-syntax#element-components).

**Quick Example**

```ts
import { RouteLink, component, createRoutes } from '@loom-js/core';

// Module scope is fine — registration is DOM-free.
const Routes = createRoutes({
    config: {
        '/': () => import('@app/pages/home'),
        '/docs/:slug': () => import('@app/pages/docs')
    }
});

export const App = component(
    (html, props) => html`
        <div>
            <nav>
                ${RouteLink({ children: 'Home', href: '/' })}
                ${RouteLink({ children: 'Docs', href: '/docs/intro' })}
            </nav>
            <main>${Routes(props)}</main>
        </div>
    `
);
```

Pages receive the matched route as `routeProps` (a `RouteValue`) — e.g. `/docs/:slug` exposes `routeProps.params.slug`.

## Route guard

A guarded-out navigation still moves the URL: `route()` pushes history before the match transform runs, so the guard suppresses content, not the address bar. An auth-style flow handles that by redirecting inside the guard — `redirect()` replace-states over the suppressed entry:

```ts
import { createRoutes, redirect } from '@loom-js/core';

import { isAuthenticated } from '@app/auth';

const Routes = createRoutes({
    config: {
        '/': () => import('@app/pages/home'),
        '/login': () => import('@app/pages/login'),
        '/account': () => import('@app/pages/account')
    },
    guard: ({ pathname }) => {
        if (pathname === '/account' && !isAuthenticated()) {
            redirect('/login');
            return false;
        }

        return true;
    }
});
```

Loop avoidance is caller-owned: the guard must pass its own redirect target (here `/login` returns `true`), or every navigation suppresses & redirects forever.

## Hash and anchor navigation

`route()` restores the native anchor jump its `preventDefault` suppresses, scrolling the element whose `id` matches the url's `#fragment` into view (a bare trailing `#` scrolls to the top):

- **Same-page** (`#fragment`-only navigation): scrolls immediately. The activity pipeline stays quiet — no location or route emission, no page reload.
- **Cross-page** (navigation with a fragment that changes the route): the fragment is held until the routed page content renders, then scrolled.
- **Initial load** (app boots on a url carrying a fragment): the browser's native scroll fired before lazily-imported content existed, so the router scrolls after the first routed render.

The deferred scroll is a **single attempt** — if the target `id` doesn't exist once the routed content has rendered (e.g. the page renders its anchors asynchronously after mount), nothing scrolls and the app owns its own scroll from there. A subsequent navigation drops any unconsumed fragment. Scrolling uses `scrollIntoView()`, so the page's `scroll-behavior` CSS controls smoothness.

## Layer 1 on its own

When you want to react to the url without a route table — a breadcrumb, an analytics hook, a tiny app that switches on `pathname` — use layer 1 directly:

```ts
import { component, locationEffect, route } from '@loom-js/core';

import { About, Home, NotFound } from '@app/component/pages';

export const App = component(
    (html) => html`
        <div>
            <nav>
                <a $click="${route}" href="/">Home</a>
                |
                <a $click="${route}" href="/about">About</a>
            </nav>
            <main>
                ${locationEffect(({ value: { pathname } }) => {
                    switch (pathname) {
                        case '/':
                            return Home();
                        case '/about':
                            return About();
                        default:
                            return NotFound();
                    }
                })}
            </main>
        </div>
    `
);
```

## Example

A fuller layer-1 app, with a button handler passing options to `route` — typed with the exported `SyntheticRouteEventListener`:

```ts
import {
    SyntheticRouteEventListener,
    component,
    locationEffect,
    route
} from '@loom-js/core';

import { About, Home, NotFound } from '@app/component/pages';

// A handler passing options to `route` — typed with the exported listener type.
const routeHome: SyntheticRouteEventListener = (event) =>
    route(event, { href: '/' });

export const App = component(
    (html) => html`
        <div>
            <header>
                <!-- Standard button example passing options to `route` -->
                <button $click="${routeHome}" type="button">loomjs</button>
                <!-- Anchor example demonstrating the simpler `route` usage -->
                <nav>
                    <a $click="${route}" href="/">Home</a>
                    |
                    <a $click="${route}" href="/about">About</a>
                </nav>
            </header>
            <main>
                ${locationEffect(({ value: { pathname } }) => {
                    switch (pathname) {
                        case '/':
                            return Home();
                        case '/about':
                            return About();
                        default:
                            return NotFound();
                    }
                })}
            </main>
        </div>
    `
);
```
