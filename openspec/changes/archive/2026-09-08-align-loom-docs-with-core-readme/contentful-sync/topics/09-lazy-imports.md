---
slug: lazy-imports
title: Lazy Imports
---
Code you don't need yet shouldn't block first render. Lazy loading has one machinery and two entry points: `lazyImport` lazily imports any value, and `lazyContent` lazily imports renderable content. Both load modules on demand as ordinary async data, and both share one cache.

## lazyImport

`lazyImport` wraps a dynamic `import()` in an [activity](/docs/activities), so lazily-loaded content composes like any other async data: subscribe with `effect`, & the import's promise is [tracked by the settlement signal](/docs/activities#transforms-the-async-data-path) — `renderToString` & `hydrate` wait for it (see [Server Rendering](/docs/server-rendering) and [Client Hydration](/docs/hydration)). The result is cached per key for the life of the page: repeat calls with the same key return the same activity without re-importing (`createRoutes` loads its route pages through this same machinery — see [Routing](/docs/routing)).

**API** `lazyImport<ImportType>(key, importer)`

**Inclusion** `import { lazyImport } from '@loom-js/core';`

**Arguments**

- `key: string | Symbol` - The cache key.
- `importer: () => Promise<ImportType>` - The import function — e.g. `async () => (await import('./chart')).Chart`.

**Returns** The import's activity — a `LazyImportActivity<ImportType>`, so `effect`, `watch` & `value()` carry `ImportType | undefined`: `undefined` until the import resolves, then whatever the importer's promise resolved to.

```ts
import { component, lazyImport } from '@loom-js/core';

import { Loading } from './loading';

const chart = lazyImport('chart', async () => (await import('./chart')).Chart);

export const Dashboard = component(
    (html) => html`
        <section>
            ${chart.effect(({ value: Chart }) => (Chart ? Chart() : Loading()))}
        </section>
    `
);
```

When the imported thing is renderable content, `lazyContent` trims the ceremony — the name says what resolves.

## lazyContent

**`lazyContent(path, importer?)`** - The same machinery & cache as `lazyImport`, typed for renderable content: the importer resolves a `ContextFunction | undefined` (defaulting to `undefined`), & the path doubles as the cache key.

```ts
import { component, lazyContent } from '@loom-js/core';

import { Loading } from './loading';

// No invented key — the path doubles as it. No undefined-dance in the
// effect — the importer resolves content already ready to render.
const chartPanel = lazyContent('./chart-panel', async () =>
    (await import('./chart-panel')).ChartPanel()
);

export const Dashboard = component(
    (html) => html`
        <section>
            ${chartPanel.effect(({ value }) => value ?? Loading())}
        </section>
    `
);
```
