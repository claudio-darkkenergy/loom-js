---
slug: app-structure
title: App Structure
---
A loom app is three kinds of module: the component tree, the browser entry that boots it, and the server modules that render it ahead of time. This topic covers what goes in each, which may import which, and where the rest of a project's files live.

None of this is enforced. It is the layout the loom docs site itself uses, with the reason for each choice, so you can keep the parts that matter and rename the rest.

## The three module roles

| Role | File | Runs in | DOM at module scope |
| --- | --- | --- | --- |
| App module | `src/app/app.ts` | browser and server | no |
| Browser entry | `src/app/bootstrap.ts` | browser only | yes |
| Server module | `src/app/prerender.entry.ts` | build or server only | no |

The **App module** exports one factory, `App()`, that returns the composed app. Everything the user sees is reachable from it.

```ts
// src/app/app.ts
import { component } from '@loom-js/core';

export const App = component(
    (html) => html`
        <main>
            <h1>Hello</h1>
        </main>
    `
);
```

The **browser entry** is the file the page's script tag loads. It reads the embedded state when there is any, then boots the app onto the root the shell provides — see [Bootstrapping](/docs/bootstrapping) and [Client Hydration](/docs/hydration).

```ts
// src/app/bootstrap.ts
import {
    APP_ROOT_ID,
    STATE_SCRIPT_ID,
    hydrate,
    primeResources
} from '@loom-js/core';

import { App } from './app';

const payload = document.getElementById(STATE_SCRIPT_ID)?.textContent?.trim();

payload && primeResources(JSON.parse(payload));
hydrate({ app: App(), root: document.getElementById(APP_ROOT_ID) ?? undefined });
```

The **server module** renders the same `App()` to a string. No page ever loads it; the build's prerender phase or a request handler does — see [Server Rendering](/docs/server-rendering).

```ts
// src/app/prerender.entry.ts
import { dehydrate, renderToString, serializeState } from '@loom-js/core/server';

import { App } from './app';

export const prerenderRoute = async (url: string, window: object) => {
    const html = await renderToString(App(), { url, window });

    return { html, state: serializeState(dehydrate(window)) };
};
```

A client-only app has the first two and no server module.

## Import direction

Both entries import the App module. The App module imports neither, and the entries never import each other.

```
bootstrap.ts ──▶ app.ts ◀── prerender.entry.ts
                   │
                   ▼
        pages / components / logic
```

The arrows only point one way because each entry carries code the other side cannot run:

- The browser entry calls `document.getElementById` and `hydrate` as soon as it loads. Import it on a server and it throws before anything renders.
- The server module imports `@loom-js/core/server` and build-time data access. Import it from the app and all of that ships to the browser.

Everything `app.ts` reaches — pages, components, activities, data providers — is shared by both sides, so it follows the App module's rules.

## Scope rules

**No DOM access at module scope in shared modules.** On a server the module is imported before any window exists. Read `document` and `window` inside components, hooks and handlers. When a module-level read is unavoidable, guard it:

```ts
// src/app/app.ts
const manifest =
    typeof window === 'undefined' ? undefined : window.__ROUTE_ASSETS__;
```

**Compose inside the returned function when the composition needs the window.** `renderToString` installs its window when the render runs, not when `App()` is called, so anything that reads `location` belongs inside:

```ts
export const App = (): ContextFunction => (ctx) =>
    PageLayout({ children: Routes({}) })(ctx);
```

**Browser-only side effects go in the browser entry.** Live reload, analytics, global stylesheet imports and anything else that should run once per page load sits in `bootstrap.ts`, where it can never run on a server.

Life-cycle hooks and event handlers only run in the browser, so they can use the DOM freely. [Server Rendering](/docs/server-rendering#semantics-worth-knowing) covers how a render behaves off-browser.

## Pages and routes

A route page is a module with a default export, loaded by a [`createRoutes`](/docs/routing) importer. Give each route a directory under `pages/`:

```ts
// src/app/app.ts
const Routes = createRoutes({
    config: {
        '/': () => import('@/app/pages/'),
        '/benchmarks': () => import('@/app/pages/benchmarks/'),
        '/docs/:topic': () => import('@/app/pages/docs/')
    }
});
```

Name the directory after the route path — `pages/docs/` for `/docs`, `pages/` itself for `/`. The build tool matches code-split chunks and per-route CSS to routes by that name; [Build Tool](/docs/build-tool#routes-and-shells) has the details.

Components only one page uses live under that page (`pages/docs/components/`). Components shared across pages live under `components/`.

## Components and logic

The reference app gives each component a directory:

```
components/content/toc/
  Toc.ts            the component
  Toc.module.css    its styles, when it has any
  index.ts          re-exports Toc.ts
```

The `index.ts` keeps import paths short (`@/app/components/content/toc`) and lets the file inside be renamed without touching its consumers. Components are grouped one level up by what they are for: `content/`, `navigation/`, `containers/`.

Code that is not a component goes under `logic/`:

- `logic/activity/` — module-level [activities](/docs/activities): the app's shared state.
- `logic/hooks/` — functions that wire activities to routes, events and data.
- `logic/providers/` — data fetching. Keep the transport swappable (a URL and headers the provider reads from one place), so the server module can point it at a different endpoint at build time.

Pages call hooks and compose components; they do not fetch directly.

## The shell and static files

There is no `index.html` in the source tree. The build tool generates one shell per route, and the `html` section of `loom.config.ts` sets its title, extra head markup and body class. The root element and the state script in it come from core, which is why the browser entry looks them up by `APP_ROOT_ID` and `STATE_SCRIPT_ID` — see [Build Tool](/docs/build-tool#html).

Static files have three homes:

| Directory | Holds | Reaches the build as |
| --- | --- | --- |
| `public/static/` | favicons, images, third-party scripts | copied as-is to `static/` (`publicDir`) |
| `public/styles/` | global stylesheets | one file each under `static/styles/` (`styles`) |
| `src/assets/` | files imported from code, such as fonts | bundled and hashed |

A component's CSS module sits beside the component. A stylesheet imported only for its side effect — a design system's base styles — is imported from the browser entry.

## Aliases and config homes

An alias for the source root is worth having: imports stop depending on how deep the importing file sits. Declare it once, in `tsconfig.json`, and the build tool resolves it from there. The reference app uses `@/*`:

```json
{
    "compilerOptions": {
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

The spelling is yours. Examples elsewhere in these docs write `@app/…`, which stands for whatever alias points at your app's source. Use relative imports inside a component's or page's own directory and the alias everywhere else.

Each kind of configuration has one home:

| File | Holds |
| --- | --- |
| `loom.config.ts` | entry, routes, shell, static files, prerender hooks |
| `tsconfig.json` | aliases; the type-check scope, which should include `loom.config.ts` |
| `package.json` | the `loom build` and `loom dev` scripts |
| `src/app/types/declarations.d.ts` | types for `define` globals, CSS modules and asset imports |
| host config (`vercel.json` here) | rewrites that send each URL to its route's shell |

## Build-time code

Code that only runs during the build stays outside `src/`. The reference app keeps it in `project/`, and `loom.config.ts` imports it for the prerender hooks. The App module never imports from there.

The server module is the one build-time file inside `src/`. It has to be built in the same bundle as the client so that CSS-module class names match and both sides share one copy of core — [Build Tool](/docs/build-tool#prerendering) explains the prerender entry.

## The full tree

The loom docs site, trimmed to its directories:

```
loom.config.ts            build config and prerender hooks
package.json
tsconfig.json             the @/* alias
vercel.json               host rewrites
project/
  client/                 build-time code the config imports
public/
  static/                 copied as-is
  styles/                 global stylesheets
src/
  assets/
    fonts/                imported from code, bundled
  app/
    app.ts                App module
    bootstrap.ts          browser entry
    prerender.entry.ts    server module
    components/           shared components, grouped by purpose
      content/
      navigation/
      ...
    logic/
      activity/           shared state
      hooks/              wiring
      providers/          data fetching
    pages/
      index.ts            the / page
      layout.ts           the layout around every page
      benchmarks/         the /benchmarks page
      docs/               the /docs page
        components/       components only this page uses
      home/
        components/       components only the / page uses
    types/
      declarations.d.ts
```

A client-only app is the same tree without `prerender.entry.ts` and without the `prerender` section in the config.
