# @loom-js/devtools

## 0.2.1

### Patch Changes

- 0d73a7a: Published from CI through npm trusted publishing, with a provenance attestation. No code changes.

## 0.2.0

### Minor Changes

- cbc2e1a: Refinements from the first preview. While docked, the page scrolls its last content clear of the dock whatever its `html`/`body` sizing, and so does any inner scroll area the dock covers, like a sticky side nav. Over an open modal dialog the HUD moves into the dialog so it stays usable. The dock can sit at the side as well as the bottom: **Auto** (the default) uses the side when the window leaves 600px of page beside it, and a chosen edge holds. Beside a side dock the page's content narrows, and at either edge fixed elements move or shrink out from under the dock. Docked at the side, the Components tab shows the tree, then an instance's details with its ancestor path and a way back. It can be resized by dragging its top edge and collapsed to its toolbar, and remembers both across reloads. **Pop out** now floats the HUD over the page instead of opening a separate window: drag it by its top bar, resize it from any edge or corner, minimize it to a round loom-logo button that sits in a bottom corner, and dock it again from the toolbar. `loom.devtools.open('float')` opens it floating, and an open HUD reopens where it was when the tab reloads, until it's closed; the popup window and `open('popup')` are gone. The devtools protocol is now version 2. Outlines never draw over the dock: an instance hidden behind it, or scrolled out of view, gets an edge marker that scrolls to it on click. The HUD carries the loom logo, and the toolbar's toggles, dock positions and Pop out are now icon buttons, Pick like the browser's element picker, and picking from the page expands and centers the instance's tree row. **Scroll to** is disabled while the instance is in view, and never scrolls an instance that already shows. A prop holding a component, such as `children`, a named slot or an `el()` element, links to the instance it rendered, and so does each ancestor in an instance's path: hover to outline it in the page, click to select it. Activities link to the instances using them, grouped by component, and from the Components tab to the Activities tab. While **Perf tracks** is on, the HUD says to open DevTools › Performance and record, since a page can't open that panel itself. Disclosure arrows are larger. Render counts read `↻ N` (re-renders since devtools connected) and can be reset. Activity values are edited in place, in both tabs. Activities show their scope, the instance owning them through `own()`, and an unlabeled owned activity is named after its owner. An activity that drives a whole app, like the router's page activity, is listed too. **Log** on an activity now prints a snapshot (name, value, pending, scope, subscribers) with the live handle under `activity`; `$loom.activity.update(…)` replaces `$loom.update(…)`.

## 0.1.0

### Minor Changes

- d4cb8bd: First release, as a preview: the loom inspector. A live component tree with names, keys, activity boundaries and render counts; an inspector for props, activities, life-cycle state and owned values; an element picker and hover/selection outlines in the page; render flashing; live editing of JSON activity values; "log to console" as `$loom`; custom console formatters; and Chrome Performance-panel tracks. The HUD docks in the page or pops out to its own window with no browser extension, and talks to the in-page backend over a versioned, same-origin `postMessage` protocol. Loaded on demand through `loom.devtools.enable()`, which also adds `loom.tree()`, `loom.inspect(node)` (pair with DevTools' `$0`) and `loom.activities()` to the console.
