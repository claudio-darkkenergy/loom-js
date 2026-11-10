# @loom-js/devtools

The loom inspector. See a running app's component tree, the props each instance last rendered with, and the activities driving the page. Pick components in the page, flash renders, edit activity values live, and send any instance or activity to the console. It needs no browser extension: the HUD docks at the bottom or side of the page, or floats over it.

> **Preview.** Devtools is new and still changing. The HUD, its layout and what it shows will move between releases; expect rough edges.

## Install

```sh
pnpm add -D @loom-js/devtools
```

### With the loom build tool

Nothing else to do. `devtools` in `loom.config.ts` defaults to `'dev'`: development builds register a lazy loader for this package, name your components from their bindings, and label your activities from theirs.

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
loom.devtools.open(); // the HUD, where it was last (docked at first)
loom.devtools.open('float'); // floating over the page; an open HUD reopens on reload until closed
loom.devtools.enable({ persist: true }); // keep it on across reloads of this tab
loom.devtools.disable();

loom.inspect($0); // the component behind the element selected in Elements
loom.tree(); // every mounted app's component tree
loom.activities(); // the activities driving the page
```

`loom.inspect`, `loom.tree` and `loom.activities` are on the `loom` global while devtools runs; `enable()` adds them and `disable()` removes them. `loom.inspect($0)` also selects that component in the HUD.

In the HUD:

- **Components**: the live tree with names, keys and activity boundaries (`⟨label⟩`). `↻ N` counts an instance's re-renders since devtools connected; **Reset ↻** clears the counts. Hover a row to outline it in the page; select it to see its props, activities, life-cycle state and owned values. Props are read-only: a parent's next render would overwrite an edit. A prop holding a component (`children`, a named slot, an `el()` element) links to the instance it rendered.
- **Activities**: every activity with its value, pending state and scope (the instance owning it through `own()`, or none). Click a JSON value to edit it in place: Enter applies, Escape cancels.
- **Pick** (the cursor-in-a-box button): click a component in the page to select it. The click never reaches the app; Escape cancels.
- **Flash renders** (the dashed box with a bolt): outlines each instance as it renders.
- **Perf tracks** (the staggered bars): records renders and activity commits on a `loom` track in Chrome's Performance panel; open DevTools › Performance and record to see them (the HUD says so while it's on).
- **Log**: sends the instance record, or an activity snapshot (name, value, pending, scope, subscribers, and the live handle as `activity`), to the page console as `$loom`.
- **Dock**: at the bottom or the side, chosen with the toolbar's window icons. **Auto** picks the side when the window has room; a chosen edge holds. Nothing stays under it: the page and covered scroll areas scroll clear, content narrows beside a side dock, and fixed elements move or shrink out of the way. Drag the inner edge to resize; the arrow collapses it. At the side, the Components tab shows the tree, then an instance's details with its path and a way back. Over an open modal dialog, the HUD moves into the dialog so it stays usable.
- **Pop out**: floats the HUD over the page in a window you drag by its top bar and resize from any edge or corner; it minimizes to a round loom-logo button in the bottom-right corner that snaps to the nearer bottom corner when dragged and restores the window where you left it on click. **Dock** (or a position icon) docks it again.
- **Outlines** never draw over the dock. An instance hidden behind it, or scrolled away, gets an edge marker that scrolls to it on click.
- **Activities** link to the instances using them (grouped by component) and to their owner; a selected instance's activity links to the Activities tab.

Turn on DevTools' "custom formatters" setting and loom records log as their names, expandable to their parts.

## Limits

- The HUD document is inlined (`srcdoc`), so a strict Content-Security-Policy that blocks inline scripts blocks the HUD. The console API and formatters still work.

## How it works

`@loom-js/core` exposes an introspection surface on `@loom-js/core/devtools`, including a render hook that stays `null` while devtools is off. This package's backend runs in the page against the app's core instance. The HUD is a prebuilt loom + pink app with its own core, running in its own document. The two talk over a versioned `postMessage` protocol and accept only same-origin peers.
