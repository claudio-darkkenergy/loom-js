# Tasks

The refinement list is open. Additions found after these land go into a new numbered group in this file, with matching spec deltas, before archive.

## 1. Dock and popup (items 1, 9)

- [x] 1.1 Reserve dock space: set `padding-bottom` on `<html>` to the dock height while docked, restoring the previous inline value on close (D1)
- [x] 1.2 Add a host-drawn resize handle, collapse to a bar, and the `dock.resize` request; persist height and collapsed state under `loom-devtools:` in try/catch-wrapped `localStorage` (D2)
- [x] 1.3 Add a header collapse/expand control in the HUD that drives `dock.resize`
- [x] 1.4 Close the popup when docking, both from the popup's dock control and from `open('dock')` (D3)
- [x] 1.5 Specs: backend/HUD tests for scrolling past the dock, the reservation removed on close, resize and collapse persisting across reload, and dock-from-popup closing the window

## 2. Outlines and pick reveal (items 2, 5)

- [x] 2.1 Clip hover, selection and flash outlines to the viewport minus the dock rect; recompute hover and flash on scroll/resize with rAF throttling (D4)
- [x] 2.2 Edge indicator chips for fully hidden instances: name plus direction, clamped to the instance's x-range, click to reveal (D4)
- [x] 2.3 On pick, expand the selected row's ancestors and scroll the row into view (D5)
- [x] 2.4 Specs: an outline never intersects the dock rect, a chip appears for instances behind the dock or above the viewport and clicking it reveals, partial visibility clips without a chip, a deep pick is revealed

## 3. Render counts (item 3)

- [x] 3.1 Badge `↻ N` with the "re-rendered N× since devtools connected" title, plus a reset-counts control in the tree toolbar (D6)
- [x] 3.2 Specs: the badge title, reset clearing every count, and a count reappearing on the next render

## 4. Inline activity editing (item 4)

- [x] 4.1 Replace `ActivityEditor` with a click-to-edit `ActivityValue` used in the Activities tab and the inspector's activity rows: Enter/blur applies, Escape cancels, invalid JSON stays open with an inline error (D7)
- [x] 4.2 Specs: edit from the inspector, cancel, invalid input; update the existing activities-tab HUD spec

## 5. Activity names and scope (items 6, 7)

- [x] 5.1 Core: `nameActivity(handle, name)` on `@loom-js/core/devtools` and a `labeled` flag on `describeActivity`; the label is set only when unset (D8)
- [x] 5.2 Build: inject activity labels by rewriting the callee, for `activity(` and `own(() => activity(` bindings at any depth, gated with component names (D8)
- [x] 5.3 Backend: map activities to their owners from `owned` values; `owner` (id and name) on activity records; owner-qualified fallback names (D9)
- [x] 5.4 HUD: show "owned by <name>" (selects the owner) or "not owned by an instance" on activity rows (D9)
- [x] 5.5 Specs: core unit tests for `nameActivity` precedence, `build.test.mjs` injection cases (top-level, in a component body, `own()`, generics, explicit label wins, unbound not labeled, production off), backend tests for owner and fallback name, a HUD test for the scope link

## 6. Logged activity snapshot (item 8)

- [x] 6.1 `log` on an activity builds `{ name, value, pending, scope, subscribers, activity }` and assigns it to `$loom` (D10)
- [x] 6.2 Specs: the snapshot's shape, and `$loom.activity.update(…)` driving the activity

## 7. Wrap-up

- [x] 7.1 Docs: the `devtools` topic (dock behavior, outlines and indicators, inline editing, scope, log snapshot, render counts) and `build-tool` (activity labels); `packages/devtools/README.md`
- [x] 7.2 Changesets: `@loom-js/devtools`, `@loom-js/core` and `@loom-js/build` minors
- [x] 7.3 `.claude/skills/skill-config.md` and `SOLID-AUDIT-REPORT.md` entries for touched or new modules
- [x] 7.4 Full checks: core, build and devtools tests, type-check, `format:check`, `openspec validate --strict`
- [ ] 7.5 Push the edited topics to Contentful and publish at ship

## 8. Root boundaries and core labels (found in the sandbox check)

- [x] 8.1 Backend: list the activity of every effect boundary, including one under no component (D11)
- [x] 8.2 Core: label the router's location, route and page activities and each `lazyImport` activity (D11)
- [x] 8.3 Specs: a backend test for an app-root boundary's activity, a core test for the router and lazy-import labels; the replay-warning test matches its own message, not any line mentioning "replay"
- [x] 8.4 Docs and changesets: the `devtools` and `diagnostics` topics, the core and devtools changesets
- [x] 8.5 `scripts/build.mjs --frontend-only` (the test build) overwrites only the frontend files, so running the tests never deletes the backend entry a dev server loads

## 9. Second review (dock space, modals, reveal, users)

- [x] 9.1 Dock space: a spacer past the page's content replaces `html` padding, so viewport-high `html`/`body` pages scroll clear; height-limited inner scroll areas crossing the dock's top edge get bottom padding, content-sized ones are left alone, all restored on close (D12)
- [x] 9.2 Modal dialogs: the dock, its handle and the page layer move into the topmost open modal dialog and back, with `moveBefore` where available (D13)
- [x] 9.3 Reveal: tree rows center in the tree pane without scrolling the page; "Scroll to" scrolls only an out-of-view instance and is disabled while the selection is in view, from a new `selection.view` event; outlines clip to scrolling ancestors (D14)
- [x] 9.4 Activity users and scope: the inspector reports users (it sent none, so it read "no rendered users"); "used by" links grouped by name step through instances; plainer no-owner copy; "Show in Activities" from the Components tab (D15)
- [x] 9.5 Disclosure arrows drawn in CSS at a legible size, in the tree, value rows and the dock's collapse control
- [x] 9.6 Specs: `dock-space.spec.ts`, `modal-follow.spec.ts`, page-layer ancestor clipping, backend reveal/selection view/node users, HUD Scroll-to state, cross-tab links, user grouping, modal use
- [x] 9.7 Docs, changeset, skill config and audit entries
- [x] 9.8 Recheck fixes: tree rows and activity items register `onRendered` on every render and read `data-reveal`, since a handler list locks after its first registration (a row already in the tree never re-revealed); smaller arrows; the dock's collapse button matches the bar's button height

## 10. Side docking (user request)

- [x] 10.1 Protocol: `DockState` gains `width`, `position` (`auto` | `bottom` | `side`), the resolved `edge` and the physical `side`; a `dock.place` request; a `dock.changed` event whenever the dock's state changes (D16)
- [x] 10.2 Hosts: lay the frame and resize handle out at the side (right, or left for `dir="rtl"`), drag to resize width, collapse to a strip; automatic position re-resolved on window resize; position, width, height and collapsed state persisted (D16)
- [x] 10.3 Dock space per edge: `html` inline padding and a conditional sideways spacer at the side; fixed elements the dock covers are shifted or shrunk to its edge at either edge, verified and reverted when that doesn't clear them, and restored on close or move (D17)
- [x] 10.4 HUD: a position menu (Automatic, Bottom, Side) in the toolbar; collapse arrows per edge; a collapsed side strip; the toolbar wraps in a narrow dock
- [x] 10.5 HUD: one panel at a time in the side dock or a narrow HUD; details header with the ancestor path and a back control; picking opens details; back reveals the row; sliding transitions, none under reduced motion (D18)
- [x] 10.6 Specs: hosts side layout and RTL, automatic switching and a held manual choice, dock-space side padding/spacer and fixed-element adjustment at both edges, HUD panel flow (select, back, path, pick)
- [x] 10.7 Docs, changeset, skill config, audit
- [x] 10.8 Found on the way: the in-place editor kept no state across re-renders, so the blur from removing its field re-applied in a foreground page; its settled flag now persists (reset when an edit is rejected) and blur from a removed field is ignored. `ActivityValue` gets a single root, because a fragment-rooted component whose effect has swapped its nodes renders empty on its next prop-driven re-render (a core bug, proposed as `fragment-root-tracking`)

## 11. Pick icon (user request)

- [x] 11.1 The Pick toggle shows a cursor-over-a-box icon after the browser's element picker, labeled `Pick` for assistive tech; icon buttons share one layout class with the collapse button; README and docs topic name the icon
- [x] 11.2 A component prop whose name already carries a tag (`el()` components, custom elements) shows as it is (`<ul>`, not `<<ul> />`); `value-view.spec.ts`
- [x] 11.3 Dock position as joined icon buttons (Auto, Bottom, Side) with the pop-out icon last, replacing the select and the text button; in the popup only the dock-back icon shows; `hud.spec.ts` checks order and pressed state
- [x] 11.4 Flash renders (a bolt in a dashed outline) and Perf tracks (staggered track bars) become icon toggles; every toolbar toggle is now an icon with its name as label and tooltip

## 12. Floating HUD and component-prop links (user request)

- [x] 12.1 Core: `DevtoolsPlacement` is `'dock' | 'float'` and `open()` without a placement reopens where the HUD was last; `instanceOf(value, owner)` resolves a component value to the live instance it rendered by walking the owner's slots, with no render-time cost (D20; an A/B benchmark ruled out recording per render); `devtools-introspection.spec.ts` covers children, slots, `el()`, a value rendered deeper down and array items
- [x] 12.2 Protocol 2: `float` placement, `edge: 'float'`, `floating` and `float` in the dock state, an instance `id` on component values, no placement in `hello` (D19)
- [x] 12.3 Hosts: floating frame with a page-side drag bar, corner resize and a minimized button that drags or restores; no page space reserved; kept in the viewport on resize; persisted; the popup window removed (D19); `dock-state.spec.ts` and `hud.spec.ts` cover pop out, move, resize, minimize, restore and docking again
- [x] 12.4 HUD: the pop-out control floats and shows the dock icon while floating; no position is pressed while floating; the collapse arrow minimizes a floating window
- [x] 12.5 HUD: a component prop with a live instance and each path ancestor outline the instance on hover and select it on click; `backend.spec.ts` checks the id, `hud.spec.ts` the hover and selection
- [x] 12.6 Found on the way: the auto-switching HUD spec deleted `window.innerWidth` to undo its override, which removed the property for later specs; it now restores the original descriptor
- [x] 12.7 Docs topic, README, changesets (devtools, core), skill config and audit
- [x] 12.8 Recheck: an open HUD reopens on reload. Core marks the tab while the HUD is open (`loom:devtools:open`), reopens it on the next registration, and clears the mark when the backend reports the close through `DevtoolsHost.hudClosed()` or devtools is disabled; `loom-console-api.spec.ts` (fails without the change) and `backend.spec.ts`
- [x] 12.9 Recheck: a new floating window sits against the viewport's bottom-right corner, so its one corner handle couldn't grow it; every edge and corner now resizes it (`resizeFloat`), moving only the dragged sides; `dock-state.spec.ts` and `hud.spec.ts`
- [x] 12.10 The minimized floating HUD is a round loom-logo button inset in the bottom-right corner each time it appears; a drag snaps it into the nearer bottom corner (not stored); restoring returns the window to where it was last expanded. The window's rect is kept in local storage under `loom-devtools:hud`, apart from `loom-devtools:dock`, so it persists across sessions. The loom logo (`logo.ts`, `LoomLogo`) also shows in the toolbar and the side strip. `hud.spec.ts` and `dock-state.spec.ts`
- [x] 12.11 While Perf tracks is on, a hint under the toolbar says where its entries go (a page can't open the Performance panel): "Recording to the loom track — open DevTools › Performance and press record."; hidden while collapsed; `hud.spec.ts`
- [x] 12.12 Popping out clamps the saved float rect to the current viewport (shifting left, then narrowing) and saves it, so a viewport that shrank while docked can't leave the window overflowing; `hud.spec.ts`
