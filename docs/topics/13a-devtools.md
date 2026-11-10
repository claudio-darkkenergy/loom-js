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

With the [build tool](/docs/build-tool), that's all. Development builds register a lazy loader for the package. The tool also names every top-level `const X = component(…)` after its binding, and labels every `const x = activity(…)` and `const x = own(() => activity(…))` after its binding, at any depth. Then, from the browser console:

```js
loom.devtools.open(); // open the HUD where it was last (docked at first)
loom.devtools.open('float'); // or float it over the page
```

Nothing loads until you ask: `loom.devtools.enable()` fetches the devtools code the first time, and no route's initial bundle grows. An open HUD reopens, docked or floating, when you reload the tab; closing it with ✕ ends that. `loom.devtools.enable({ persist: true })` keeps it on across reloads of the tab and starts it before the app mounts; `loom.devtools.disable()` turns it off and clears that.

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

- **Components**: the live tree, with names, keys and activity boundaries. `↻ N` on a row counts the times that instance re-rendered since devtools connected; first renders happen before devtools loads, so a row without a count hasn't re-rendered while you watched. **Reset ↻** sets every count back to zero. Hover a row to outline that instance in the page. Select it to see its props, its activities, its life-cycle state and its `own()` values. Props are read-only: the parent's next render would overwrite an edit. A prop holding a component, like `children`, a named slot (`slot:title`) or an `el('ul')` element, links to the instance it rendered: hover it to outline that instance in the page, click to select it. A row picked in the page opens its collapsed ancestors and scrolls to the middle of the tree. **Scroll to** brings the instance into view in the page; it's disabled while the instance is already in view. **Show in Activities** on one of its activities opens the Activities tab at that activity. The details start with the instance's path from the root; hover an ancestor to outline it, click to select it.
- **Activities**: every activity with its value and pending state, including one that drives a whole app, like the router's page activity.

Each activity, in either tab, says who uses it and who owns it:

- **used by**: the rendered instances that render one of its effects or bind it to an attribute. Click a name to select that instance in the Components tab. Instances of one component are grouped, as in `TocLink ×16`; each click selects the next one. "not used by a rendered instance" means nothing mounted uses it right now.
- **owned by**: the instance holding it through `own()`, which it lives and dies with. Click to select it. "no owner" means it wasn't created through `own()`: it lives at module scope, or a render creates it anew each time.

Activities show as `⟨label⟩`, using the `label` option or the label the build tool injected. An explicit `label` always wins. Core labels its own: `⟨router.location⟩`, `⟨router.route⟩`, `⟨router.page⟩` and `⟨lazyImport(key)⟩`. An unlabeled activity an instance owns shows as `Counter › activity#N`; any other unlabeled one as `activity#N`.

Click a JSON value to edit it in place, in either tab. Enter or leaving the field applies the edit through the activity's own `update`, transform included; Escape cancels. Text that isn't valid JSON stays in the field with the error under it. **Reset** goes through the activity's `reset`.

The toolbar:

- **Pick** (the cursor-in-a-box button): click a component in the page to select it. The click never reaches the app; Escape cancels.
- **Flash renders** (the dashed box with a bolt): outlines each instance in the page as it renders.
- **Perf tracks** (the staggered bars): records each render and activity commit on a `loom` track in Chrome's Performance panel. A page can't open that panel, so while it's on the HUD shows where to look: open DevTools › Performance and record.
- **Dock position** (three window icons: Auto, Bottom, Side): **Auto** docks at the side when the window leaves at least 600px of page beside the dock, and at the bottom otherwise, switching as the window resizes. **Bottom** or **Side** holds that edge whatever the width, until you pick **Auto** again. The side is the right, or the left on right-to-left pages.
- **Pop out / Dock** (the arrow icon after them): floats the HUD over the page in a window you drag by its top bar and resize from any edge or corner, and docks it again. A position icon also docks it at that position.
- **Collapse / minimize** (the arrow): collapses the docked HUD to its toolbar at the bottom, or to a narrow strip at the side. A floating HUD minimizes to a round loom-logo button in the bottom-right corner: click it to restore the window where you left it. Drag it and it snaps into the nearer bottom corner; it starts from the bottom-right each time it appears.

Docked at the side, the Components tab shows one panel at a time: the tree, then an instance's details when you select it, with **Tree** to go back. A floating window narrower than 700px does the same.

A floating HUD reserves no page space: it sits over the page, and you move it out of the way. Its position and size are remembered in local storage, so they carry across reloads and new sessions, and it stays inside the window when the window shrinks.

Nothing stays under the dock. At the bottom, the page can scroll its last content clear of the HUD, however it sizes `html` and `body`, and inner scroll areas the dock covers, like a sticky side nav, get bottom padding so their last items scroll clear too. At the side, the page's content narrows to the space left, and anything that can't narrow scrolls sideways. At either edge, fixed elements move beside the dock or shrink to end at it: a cookie bar sits above a bottom dock, and a full-width header ends at a side dock. The page's media queries still measure the whole window, so a wide layout gets squeezed rather than switching to its narrow form. Drag the dock's inner edge to resize it. The position, the sizes and the collapsed state are remembered across reloads.

A modal dialog would cover the dock and make it unclickable, so while one is open the HUD and the outlines move into it, and move back when it closes. You can inspect and pick inside a search or settings modal.

Outlines stay out of the HUD: an instance partly behind the dock, or partly scrolled out of an inner scroll area, is outlined only where it shows. One that is entirely hidden gets a marker at the nearest edge with its name and an arrow toward it; click the marker to scroll to it.

**Log** on an instance sends its record to the page console as `$loom`. On an activity it logs a snapshot: its name, value, pending state, scope (the owning instance, or `null`) and the instances using it. The live handle is under `activity`, so `$loom.activity.update(…)` works there.

## Production builds

`devtools: 'lazy'` in `loom.config` makes devtools available in production builds too, with the same on-demand loading. The default, `'dev'`, keeps production builds free of devtools code and injected names; `false` turns it off everywhere. See [Build Tool](/docs/build-tool#devtools).

## Limits

- The HUD document is inlined, so a Content-Security-Policy that blocks inline scripts blocks the HUD. The console API still works.
- Components defined inside a function body aren't named by the build tool; give them a `name`.
- Activity labels come from a plain `const`/`let` binding to `activity(…)` or `own(() => activity(…))`. An aliased import (`import { activity as act }`), a destructured binding or an `own()` callback with a block body isn't labeled; pass a `label` there.
