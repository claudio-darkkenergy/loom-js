---
slug: getting-started
title: Getting Started
---
loom is a reactive, components-first JavaScript framework. Components are tagged templates, reactivity is a small pub/sub primitive called an activity, and the same render path runs in the browser, on a server, and at build time.

## What is loom

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

## Install

```bash
npm i @loom-js/core
```

```bash
yarn add @loom-js/core
```

## Inclusion

```ts
import * as Loom from '@loom-js/core';
```

## Where next

The topics in the side navigation form a learning path. Start with [Bootstrapping](/docs/bootstrapping) to mount your first app, then work through [Components](/docs/components) and [Activities](/docs/activities) - everything else builds on those two.
