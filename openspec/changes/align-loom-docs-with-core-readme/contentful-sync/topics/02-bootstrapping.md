---
slug: bootstrapping
title: Bootstrapping
---
## The app and init

The app is where you first introduce your component ecosystem (one or more components that will drive your application). Bootstrapping is the process where you create and configure your app.

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

A fuller bootstrap: the app takes content, mounts into a specific root, and confirms the mount.

```ts
import { init } from '@loom-js/core';

import content from './content.json';
import { Page } from './page';

const rootNode = document.querySelector('#page-content');

init({
    app: Page(content),
    onAppMounted: (app) => {
        // The app node - all component descendants included - is in the DOM.
        console.log(document.contains(app)); // => true
    },
    root: rootNode
});
```

`init` wipes the root to the app shell immediately. When the page arrives pre-rendered, boot with `hydrate` instead — it leaves the served markup in place and swaps once the app has settled: see [Client Hydration](/docs/hydration). Prerendering the same app at build time runs through `renderToString` — see [Server Rendering](/docs/server-rendering).
