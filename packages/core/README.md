<h1 align="center">
  <img width="140" height="140" src="https://github.com/darkkenergy/loomjs/blob/main/packages/core/assets/img/loom-logo.png">
  <div>loomjs</div>
</h1>

> A reactive components-first JavaScript framework.

## Feature Highlights

- **Micro-updates** on rerenders - updates are made at the attribute & node-levels.
- **Self-cleanup** leveraging native JS garbage collection & `WeakMap` to release dead nodes from memory.
- **Reactivity** to rerender any number of components used within a component template - see [Activities](https://loom-js-docs.vercel.app/docs/activities).
- **Tagged Templates** for performant processing of component templates - see [Components](https://loom-js-docs.vercel.app/docs/components).
- **Custom elements** (`defineElement`) - consume loom components from any page as `<some-element>` - see [Custom Elements](https://loom-js-docs.vercel.app/docs/custom-elements).
- **Client-side Routing** for dynamic rendering of components based on `Location` data - see [Routing](https://loom-js-docs.vercel.app/docs/routing).
- **Lazy-loading** of routes & content (`lazyImport`), tracked by the settlement signal - see [Lazy Imports](https://loom-js-docs.vercel.app/docs/lazy-imports).
- **Server rendering** (`@loom-js/core/server`) - render to an HTML string for SSR & SSG through the same code path the browser runs - see [Server Rendering](https://loom-js-docs.vercel.app/docs/server-rendering).
- **Client hydration** (`hydrate`) - invisible takeover of pre-rendered pages: one atomic swap once the app has settled, no content flashes - see [Client Hydration](https://loom-js-docs.vercel.app/docs/hydration).
- **Dehydrated state** (`resource` → `dehydrate` → `primeResources`) - hand the server's fetched data to the client, so a primed hydration never refetches - see [Dehydrated State](https://loom-js-docs.vercel.app/docs/dehydrated-state).
- **0 Dependencies** (you're welcome)
- **Typescript Types** included.

## Install

```bash
npm i @loom-js/core
yarn add @loom-js/core
pnpm add @loom-js/core
```

## Inclusion

```ts
import * as Loom from '@loom-js/core';
```

Server rendering lives in its own entry:

```ts
import { renderToString } from '@loom-js/core/server';
```

## Quick Example

A component is a tagged template. Define one, then mount it with `init`.

```ts
import { component, init } from '@loom-js/core';

interface ButtonProps {
    label: string;
    type: string;
}

export const Button = component<ButtonProps>(
    (html, props) => html`
        <button type="${props.type}">${props.label}</button>
    `
);

init({
    app: Button({ label: 'Save', type: 'button' }),
    root: document.body
});
```

## Documentation

The full documentation lives at [loom-js-docs.vercel.app](https://loom-js-docs.vercel.app/docs/getting-started). The topics are ordered as a learning path:

**Onboarding**

- [Getting Started](https://loom-js-docs.vercel.app/docs/getting-started)
- [Bootstrapping](https://loom-js-docs.vercel.app/docs/bootstrapping) - mounting an app with `init`.
- [Configuration](https://loom-js-docs.vercel.app/docs/configuration) - `globalConfig` & `appendEvents`.

**Templating**

- [Components](https://loom-js-docs.vercel.app/docs/components) - templates, props, life-cycle hooks, refs.
- [Element Syntax](https://loom-js-docs.vercel.app/docs/element-syntax) - composing components in markup, slots, keys.
- [Fragments](https://loom-js-docs.vercel.app/docs/fragments) - templates with more than one root node.
- [Custom Elements](https://loom-js-docs.vercel.app/docs/custom-elements) - `defineElement`, light & shadow DOM.

**Reactivity**

- [Activities](https://loom-js-docs.vercel.app/docs/activities) - state, effects, transforms, the settlement signal.
- [Routing](https://loom-js-docs.vercel.app/docs/routing) - `createRoutes`, guards, hash navigation.
- [Lazy Imports](https://loom-js-docs.vercel.app/docs/lazy-imports) - `lazyImport` & `lazyContent`.

**Server-first**

- [Server Rendering](https://loom-js-docs.vercel.app/docs/server-rendering) - `renderToString`, SSR & SSG.
- [Client Hydration](https://loom-js-docs.vercel.app/docs/hydration) - `hydrate` & `settled`.
- [Dehydrated State](https://loom-js-docs.vercel.app/docs/dehydrated-state) - `resource`, `dehydrate`, `primeResources`.

**Reference**

- [Diagnostics](https://loom-js-docs.vercel.app/docs/diagnostics) - warnings & debug logging.

## Recognition

Thanks go out to Andrea Giammarchi for providing [the algorithm](https://gist.github.com/WebReflection/d3aad260ac5007344a0731e797c8b1a4) that made this solution possible. It is also at the core of [hyper(HTML)](https://github.com/WebReflection/hyperHTML), a light & fast virtual DOM alternative that Andrea created and maintains.
