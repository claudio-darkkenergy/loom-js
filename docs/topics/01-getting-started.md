---
slug: getting-started
title: Getting Started
---
loom is a reactive, components-first JavaScript framework. Components are tagged templates, reactivity is a small pub/sub primitive called an activity, and the same render path runs in the browser, on a server, and at build time.

## Feature highlights

- **Micro-updates** on rerenders - updates are made at the attribute & node-levels.
- **Self-cleanup** leveraging native JS garbage collection & `WeakMap` to release dead nodes from memory.
- **Reactivity** to rerender any number of components used within a component template - see [Activities](/docs/activities).
- **Tagged Templates** for performant processing of component templates - see [Components](/docs/components).
- **Custom elements** (`defineElement`) - consume loom components from any page as `<some-element>` - see [Custom Elements](/docs/custom-elements).
- **Client-side Routing** for dynamic rendering of components based on `Location` data - see [Routing](/docs/routing).
- **Lazy-loading** of routes & content (`lazyImport`), tracked by the settlement signal - see [Lazy Imports](/docs/lazy-imports).
- **Server rendering** (`@loom-js/core/server`) - render to an HTML string for SSR & SSG through the same code path the browser runs - see [Server Rendering](/docs/server-rendering).
- **Client hydration** (`hydrate`) - invisible takeover of pre-rendered pages: one atomic swap once the app has settled, no content flashes - see [Client Hydration](/docs/hydration).
- **Dehydrated state** (`resource` → `dehydrate` → `primeResources`) - hand the server's fetched data to the client, so a primed hydration never refetches - see [Dehydrated State](/docs/dehydrated-state).
- **0 Dependencies** (you're welcome)
- **Typescript Types** included.

## Create an app

One command creates a working app: a single app that builds with [`@loom-js/build`](/docs/build-tool), renders every route at build time and hydrates it in the browser, in TypeScript, with Biome formatting, a new git repository and its dependencies installed.

```bash tab=npm group=create
npm create @loom-js@latest my-app
```

```bash tab=yarn group=create
yarn create @loom-js my-app
```

```bash tab=pnpm group=create
pnpm create @loom-js my-app
```

```bash tab=bun group=create
bun create @loom-js my-app
```

Nothing is installed globally. `npx @loom-js/create`, `pnpm dlx @loom-js/create`, `yarn dlx @loom-js/create` and `bunx @loom-js/create` do the same. Then `cd my-app` and run the `dev` script.

In a terminal it asks about each choice you don't pass as a flag; `--yes` takes every default:

- `--layout monorepo` puts the app at `apps/web` under workspaces, run with Turborepo.
- `--spa` renders in the browser only, with no build-time render.
- `--ui pink` adds the [Pink](/docs/pink) components.
- `--tailwind` adds Tailwind CSS v4.
- `--formatter prettier` (or `none`) replaces Biome.
- `--js` writes JavaScript instead of TypeScript.
- `--git <url>` clones an existing repository and adds the app to it; `--git none` skips git.
- `--no-install` skips the install.

The app follows the layout described in [App Structure](/docs/app-structure).

## Install

To add loom to an existing project instead:

```bash tab=npm group=pm
npm i @loom-js/core
```

```bash tab=yarn group=pm
yarn add @loom-js/core
```

```bash tab=pnpm group=pm
pnpm add @loom-js/core
```

## Inclusion

```ts
import * as Loom from '@loom-js/core';
```

## Where next

The side navigation is ordered as a learning path. Start with [Bootstrapping](/docs/bootstrapping) to mount your first app, then work through [Components](/docs/components) and [Activities](/docs/activities) — the foundations the later concepts build on. [Configuration](/docs/configuration) and [Diagnostics](/docs/diagnostics) are reference stops you can return to any time.
