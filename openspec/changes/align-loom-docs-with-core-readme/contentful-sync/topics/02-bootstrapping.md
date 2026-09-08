---
slug: bootstrapping
title: Bootstrapping
---
Every loom app starts with a single call: `init` takes your app's root component and mounts it into the document. This topic covers that boot call — its options, their defaults, and a fuller example.

## The app and init

Your app is your component ecosystem — one or more components that drive the application. Bootstrapping creates and configures it.

**API** `init(options)`

**Inclusion** `import { init } from '@loom-js/core';`

## AppInitProps

**Arguments**

- interface `AppInitProps` = `{ app: ContextFunction; globalConfig?: AppGlobalConfig; onAppMounted?: (mountedApp: Element) => void; placement?: Placement; root?: Element | null; }`
    - `app` - A `ContextFunction` which returns a single node (the app node) that will contain all other nodes from your app's component ecosystem, and it will eventually be appended to the app's root node once the initial render is complete.
    - `placement` - [Default: `'replace'`] Where the app node lands relative to the root's existing children — type `Placement` = `'replace' | 'append' | 'prepend'`: `'replace'` replaces them, `'append'` inserts after them, `'prepend'` inserts before them.
    - `globalConfig` - [Default: `{}`] Boot-time framework configuration — see [Configuration](/docs/configuration).
    - `onAppMounted` - A callback function which gets called once the app node is appended to the desired DOM root node.
    - `root` - [Default: `document.body`] A DOM node which the app node is appended to once the initial render is complete. The document `<head>` & `<body>` can't serve as the root directly — when the root is omitted, `null`, or one of those, a fresh `<div id="loom-app">` is prepended to the body & used instead.

**Quick Example**

```ts
import { init } from '@loom-js/core';

import { App } from './app';

init({
    app: App(),
    onAppMounted: (app) => {
        console.log(document.contains(app)); // => true
    },
    root: document.body
});
```

## Example

A fuller bootstrap exercising every option: content-driven app, scoped debug config, and an `append` mount that keeps the root's existing children — confirmed once mounted.

```html
<!-- The served shell: the root already holds a static banner. -->
<div id="page-content">
    <header>…static banner…</header>
</div>
```

```ts
import { init } from '@loom-js/core';

import content from './content.json';
import { Page } from './page';

// `placement: 'append'` mounts the app after the banner instead of
// replacing it.
init({
    app: Page(content),
    globalConfig: {
        // Opt-in debug narration, scoped to activity updates (see Diagnostics).
        debug: true,
        debugScope: { activity: true }
    },
    onAppMounted: (app) => {
        // The app node - all component descendants included - is in the DOM.
        console.log(document.contains(app)); // => true
    },
    placement: 'append',
    root: document.querySelector('#page-content')
});
```

```html
<!-- After mount: `append` kept the banner; the app node follows it. -->
<div id="page-content">
    <header>…static banner…</header>
    <main>…the rendered `Page` app…</main>
</div>
```

The banner survived because `append` respects what the root already holds — a small taste of a bigger idea.

`init` mounts the app shell immediately, replacing the root's children by default. When the whole page arrives pre-rendered, boot with `hydrate` instead — it leaves the served markup in place and swaps once the app has settled: see [Client Hydration](/docs/hydration). Prerendering the same app at build time runs through `renderToString` — see [Server Rendering](/docs/server-rendering).
