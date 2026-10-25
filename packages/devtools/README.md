# @loom-js/devtools

The loom inspector. See a running app's component tree, the props each instance last rendered with, and the activities driving the page. Pick components in the page, flash renders, edit activity values live, and send any instance or activity to the console. It needs no browser extension: the HUD docks at the bottom of the page or pops out to its own window.

> **Preview.** Devtools is new and still changing. The HUD, its layout and what it shows will move between releases; expect rough edges.

## Install

```sh
pnpm add -D @loom-js/devtools
```

### With the loom build tool

Nothing else to do. `devtools` in `loom.config.ts` defaults to `'dev'`: development builds register a lazy loader for this package and name your components from their bindings.

```ts
export default defineConfig({
    entry: './src/bootstrap.ts',
    devtools: 'dev' // 'dev' (default) | 'lazy' (production too) | false
});
```

`'lazy'` makes devtools available in production builds as well. No route's initial bundle grows; the code loads only when switched on.

### With raw esbuild or another bundler

Register the loader yourself, before the app boots, and name components explicitly:

```ts
import { registerDevtools } from '@loom-js/core/devtools';

registerDevtools(() => import('@loom-js/devtools'));

export const Card = component(
    (html) => html`
        …
    `,
    { name: 'Card' }
);
```

## Use

From the browser console:

```js
loom.devtools.open(); // docked HUD
loom.devtools.open('popup'); // its own window
loom.devtools.enable({ persist: true }); // keep it on across reloads of this tab
loom.devtools.disable();

loom.inspect($0); // the component behind the element selected in Elements
loom.tree(); // every mounted app's component tree
loom.activities(); // the activities driving the page
```

`loom.inspect`, `loom.tree` and `loom.activities` are on the `loom` global while devtools runs; `enable()` adds them and `disable()` removes them. `loom.inspect($0)` also selects that component in the HUD.

In the HUD:

- **Components**: the live tree with names, keys and activity boundaries (`⟨label⟩`), plus a render count per instance. Hover a row to outline it in the page; select it to see its props, activities, life-cycle state and owned values. Props are read-only: a parent's next render would overwrite an edit.
- **Activities**: every activity with its value and pending state. JSON-representable values can be edited and reset.
- **Pick**: click a component in the page to select it. The click never reaches the app; Escape cancels.
- **Flash renders**: outlines each instance as it renders.
- **Perf tracks**: records renders and activity commits on a `loom` track in Chrome's Performance panel.
- **Log**: sends the live instance record or activity handle to the page console as `$loom`.

Turn on DevTools' "custom formatters" setting and loom records log as their names, expandable to their parts.

## Limits

- The HUD document is inlined (`srcdoc` / `document.write`), so a strict Content-Security-Policy that blocks inline scripts blocks the HUD. The console API and formatters still work.
- Opening the popup from the console has no user activation, so a browser may block it. The HUD then docks; its "Pop out" button is a real click and works.

## How it works

`@loom-js/core` exposes an introspection surface on `@loom-js/core/devtools`, including a render hook that stays `null` while devtools is off. This package's backend runs in the page against the app's core instance. The HUD is a prebuilt loom + pink app with its own core, running in its own document. The two talk over a versioned `postMessage` protocol and accept only same-origin peers.
