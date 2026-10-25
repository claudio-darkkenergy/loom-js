---
slug: devtools
title: Devtools
package: @loom-js/devtools
---
Loom's inspector shows a running app's component tree, the props each instance last rendered with, and the activities driving the page. It needs no browser extension: the HUD docks at the bottom of the page or opens in its own window, and a console API inspects the app from the browser console. This topic covers turning it on, the console API, the HUD, and production use.

> **Preview.** Devtools is new and still changing. The HUD, its layout and what it shows will move between releases; expect rough edges.

## Turning it on

Install the package as a dev dependency:

```bash tab=npm group=pm
npm i -D @loom-js/devtools
```

```bash tab=yarn group=pm
yarn add -D @loom-js/devtools
```

```bash tab=pnpm group=pm
pnpm add -D @loom-js/devtools
```

With the [build tool](/docs/build-tool), that's all. Development builds register a lazy loader for the package, and the tool names every top-level `const X = component(…)` after its binding. Then, from the browser console:

```js
loom.devtools.open(); // dock the HUD
loom.devtools.open('popup'); // or open it in its own window
```

Nothing loads until you ask: `loom.devtools.enable()` fetches the devtools code the first time, and no route's initial bundle grows. `loom.devtools.enable({ persist: true })` keeps it on across reloads of the tab and starts it before the app mounts; `loom.devtools.disable()` turns it off and clears that.

Without the build tool, register the loader before the app boots, and name components yourself (see [Components](/docs/components#display-names)):

```ts
import { registerDevtools } from '@loom-js/core/devtools';

registerDevtools(() => import('@loom-js/devtools'));
```

**Inclusion** `import { registerDevtools } from '@loom-js/core/devtools';`

## The console API

While devtools runs, the `loom` global also inspects the app. `loom.devtools.enable()` adds these, and `disable()` removes them:

- `loom.inspect($0)` returns the component that rendered the element selected in the Elements panel: its name, key, props, activities, parent and rendered node. It also selects that component in the HUD.
- `loom.tree()` returns every mounted app's component tree, activity boundaries included.
- `loom.activities()` returns the activities driving the page, each with its name, current value, pending state and live handle.

They return plain objects the console can expand. With DevTools' "custom formatters" setting on, they log as component and activity names instead.

## The HUD

The HUD has two tabs:

- **Components**: the live tree, with names, keys, activity boundaries (shown as `⟨label⟩` or `activity#N`) and a render count per instance. Hover a row to outline that instance in the page. Select it to see its props, its activities, its life-cycle state and its `own()` values. Props are read-only: the parent's next render would overwrite an edit.
- **Activities**: every activity with its value and pending state. JSON values can be edited and reset; the edit goes through the activity's own `update`, transform included.

The toolbar:

- **Pick**: click a component in the page to select it. The click never reaches the app; Escape cancels.
- **Flash renders**: outlines each instance in the page as it renders.
- **Perf tracks**: records each render and activity commit on a `loom` track in Chrome's Performance panel.
- **Pop out / Dock**: moves the HUD between the page and its own window. The window reconnects by itself when the page reloads.

**Log** on an instance or activity sends the live object to the page console as `$loom`, so `$loom.update(…)` works there.

## Production builds

`devtools: 'lazy'` in `loom.config` makes devtools available in production builds too, with the same on-demand loading. The default, `'dev'`, keeps production builds free of devtools code and injected names; `false` turns it off everywhere. See [Build Tool](/docs/build-tool#devtools).

## Limits

- The HUD document is inlined, so a Content-Security-Policy that blocks inline scripts blocks the HUD. The console API still works.
- `loom.devtools.open('popup')` from the console has no user activation, so the browser may block the window. The HUD then docks, and its Pop out button works.
- Components defined inside a function body aren't named by the build tool; give them a `name`.
