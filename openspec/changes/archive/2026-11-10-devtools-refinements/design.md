# Design

## Context

See proposal.md for the motivation. Current state that matters:

- The dock is a `position: fixed` iframe (`40vh`, `z-index 2147483645`) appended to `<html>`. Nothing reserves page space for it. `open('dock')` never closes an open popup (`backend/hosts.ts`).
- The page layer's outlines sit at `z-index 2147483646`, above the dock. They are placed from `getBoundingClientRect` with no clipping (`backend/page-layer.ts`). Only the selection redraws on scroll.
- Render counts come from the `renders` push topic, which starts at subscribe. First renders happen before devtools loads, so `×N` counts re-renders only.
- An activity's name is its diagnostic subject: an explicit `label`, or a generated `activity#N`. The subject lives in core's private `activitySubjects` map (`lib/devtools/activity-ref.ts`). It is a plain object, so its `label` can be set after creation.
- `own(create)` caches values per instance in `ctx.owned.values`. The backend can already read them from the tree walk.
- `log` on an activity assigns the raw handle to `$loom`. The readable version depends on Chrome's custom formatters, which are off by default.

## Goals / Non-Goals

**Goals:** the nine refinements in the proposal. No protocol major bump. Core changes stay additive and sit on the `@loom-js/core/devtools` entry, never the main entry.

**Non-Goals:** shrinking the app's viewport the way browser devtools does (an in-page tool can't), docking to other edges, AST-based source transforms.

## Decisions

### D1. Reserve dock space with bottom padding on `<html>`

While docked, the backend sets `padding-bottom` on `document.documentElement` to the dock's current height. It records the previous inline value and restores it on close. This lets document-scrolled pages bring their last content above the dock.

- Alternative: shrink `<body>` with `height: calc(100% - dock)`. Rejected because it breaks apps that size against `100vh` or the body.
- Alternative: a spacer element. Rejected because it lands inside app layout, e.g. a flex or grid `<body>`.
- Limit: apps that scroll an inner `100vh` container gain nothing from the padding. Resize and collapse (D2) cover them.

### D2. Resize and collapse live in the host, not the HUD document

The drag handle is a thin strip the backend draws in the page, above the iframe's top border. Drag events inside the iframe would be lost when the pointer leaves it. Collapse shrinks the iframe to a bar height, which the HUD header fits. The HUD asks for collapse or expand over the protocol with a new `dock.resize` request carrying `{ collapsed?, height? }`. Size and collapsed state persist in `localStorage` under a `loom-devtools:` key, wrapped in try/catch. The padding from D1 follows the current height.

### D3. Docking closes the popup (superseded by D19)

`hosts.open('dock')` closes `popup` after the dock opens. When the request comes from the popup itself, the backend replies first and then closes the window.

### D4. Clip outlines to the visible area and draw edge indicators

The visible area is the viewport rectangle minus the dock's rectangle; in popup mode it is the full viewport. Each outline rect is intersected with it:

- If the intersection is non-empty, draw the intersection.
- If it is empty, draw an indicator chip ("↓ Counter" or "↑ Counter") at the nearest edge of the visible area, clamped horizontally to the instance's x-range.

Lowering the layer's z-index below the dock is not enough, because outlines would still draw behind the dock with no hint. Clipping is needed either way. Chips have `pointer-events: auto` and run `reveal` on click. Hover and flash outlines also recompute on scroll and resize (one rAF-throttled handler), not only the selection.

### D5. Pick reveal is a frontend concern

On the `selected` event, the frontend expands every ancestor of the id, using the tree's `parentId` chain. After the next render it calls `scrollIntoView({ block: 'nearest' })` on the row. No protocol change.

### D6. Render-count badge

Show `↻ N` with the title "re-rendered N× since devtools connected". A "reset counts" control in the tree toolbar clears the frontend's counts map. Counts stay a frontend tally, so the backend is unchanged.

### D7. Inline editing replaces the editor form

Editable values render as a click-to-edit field in both the Activities tab and the inspector's activity rows: one `ActivityValue` component, replacing `ActivityEditor`. Enter or blur sends `activity.update`, and Escape restores. A JSON parse failure keeps the field open with the error inline, checked before sending; the backend's `invalid-value` stays as the backstop. Blur applies only when the text changed.

### D8. Activity labels are injected by wrapping the callee

The plugin matches `(?:const|let)\s+(<ident>)\s*(?::[^=]*)?=\s*` followed by either `activity` or `(?:\w+\.)?own\(\s*\(\)\s*=>\s*activity`, then `\s*[<(]`, at any indentation. It rewrites only the `activity` callee to `__loomLabelActivity('<ident>', activity)`. Generic arguments still work (`__loomLabelActivity('x', activity)<T>(0)` is a TS instantiation expression, which esbuild supports). `__loomLabelActivity` is a function declaration the plugin appends to the module, so it is hoisted above every use. It returns a function that calls `activity` with the same arguments and then `nameActivity(handle, '<ident>')`, imported from `@loom-js/core/devtools`. Core exports only `nameActivity`. `describeActivity` gains a `labeled` flag so D9 can tell labels from generated tags.

- `nameActivity` sets the subject's `label` only when there is none, so an explicit label wins.
- Rewriting the callee needs no matching of the closing paren, so no parser.
- Alternative: wrap the whole call, `__name(activity(…), 'x')`. Rejected because it needs paren matching through template literals and nested calls.
- Alternative: append statements after the declaration, as component naming does. That only works at top level.
- Known misses: aliased imports (`import { activity as act }`), destructured or computed bindings, multi-line `own(` callbacks with a block body. These fall back to D9.
- Injected labels also show in `setDebug` narration in those builds. That's wanted: they're the same names authors see in devtools.

### D9. Owner-qualified fallback and scope are computed in the backend

During `listActivities`, the inspector's walk builds a map from each `ctx.owned.values` activity to its ctx. An activity record gains `owner?: { id, name }`. For an activity with no label and an owner, the record's name becomes `<owner name> › activity#N`. Diagnostics keep plain `activity#N`, because core has no owner knowledge in that path. The HUD shows "owned by <name>" as a link that selects the owner, or "not owned by an instance". This is an additive protocol field, so the protocol major stays 1.

### D10. Logged activity snapshot

`log` on an activity builds `{ name, value, pending, scope, subscribers, activity }`:

- `scope` is the owner's `inspectContext` record or `null`.
- `subscribers` holds the subscribing instances' `inspectContext` records.
- `activity` is the live handle.

`$loom` is set to the same object. The formatter's activity header still applies when custom formatters are on, because it already recognizes records with an `activity` field (`formatters.ts`).

### D11. Root boundaries are listed; core labels its own activities

Found while checking the first nine against the sandbox.

- `listActivities` collected activities only from components, so a boundary with no component above it (an app root such as the router's page effect) was missing. The walk now lists every effect boundary's activity, with no users when no component holds it.
- The router's three activities and `lazyImport`'s are created inside core, where the build tool's binding match never reaches. Core passes explicit labels. These are real labels, so they show in diagnostics and production builds too; that costs a few bytes and reads better than `activity#N` in settlement warnings.

### D12. Dock space: a spacer for the document, padding for covered scroll areas

The sandbox check passed with `html` padding, but the docs app sets `html` and `body` to the viewport's height, and content overflowing a fixed-height `html` ignores its padding. A hidden, absolutely positioned spacer now sits at the document's content bottom with the dock's height, re-measured on resize, scroll, clicks, transitions and body size changes. Inner scroll areas are found by sampling along the dock's top edge: each `overflow-y: auto|scroll` ancestor crossing it gets bottom padding equal to the covered part. Padding is kept only when the area keeps its height, which tells a height-limited area (a sticky side nav) from a content-sized one (a code block). This replaces D1, and D1's limit for inner-scrolling apps no longer applies.

### D13. The HUD follows modal dialogs

A modal dialog sits in the top layer and makes the rest of the document inert, and no z-index or re-raised popover beats that, so this was checked in Chrome. The backend watches `open` attributes and child lists, and moves the dock, handle and page layer into the topmost open modal dialog and back. `moveBefore` keeps the frame's document alive. Without it, the frame reloads and the HUD reconnects. Limit: a dialog that creates a containing block (a `transform`, say) misplaces the fixed dock.

### D14. Reveal only what is out of view

`scrollIntoView` on a sticky or fixed element scrolls the page every call without moving the element, which is why "Scroll to" on a table-of-contents link kept scrolling. The page layer now decides "in view" (wholly visible, or filling its clip region) from the visible area and the instance's clipping ancestors. It scrolls only when the instance is out of view, and reports changes as a `selection.view` event that disables the button. Tree rows center by setting their pane's `scrollTop`; `scrollIntoView` inside the frame can scroll the page too.

### D15. Users are links, grouped by name

The inspector sent activity records with no users, so a selected instance's activities read "no rendered users" while the Activities tab counted them. Both now come from one walk. Users render as links grouped by name (`TocLink ×16`); each click selects the next instance in that group. A selected instance's activity gets "Show in Activities", which opens that tab at the item and flashes it.

### D16. Side docking: automatic by default, a manual choice holds

The dock's `position` setting is `auto`, `bottom` or `side`. `auto` resolves to the side while the window leaves at least 600px of page beside the dock (1000px with the default 400px width), otherwise to the bottom, and re-resolves on window resize. Choosing `bottom` or `side` holds it and turns `auto` off until the user picks it again. The side is the inline end: right, or left when the document's direction is right-to-left. Right was chosen over left for familiarity, since browser devtools and most inspectors dock there. The backend pushes `dock.changed` with the full `DockState` whenever it changes, including an automatic switch, so the HUD's layout follows without polling. Collapsing at the side leaves a 34px strip.

### D17. Nothing stays under the dock, at either edge

- Side: inline-end padding on `html` narrows flowing content; a spacer past the page's widest content adds sideways scroll room only when something can't narrow.
- Fixed elements at both edges: points sampled inside the dock's area and along its inner edge find `position: fixed` elements the dock overlaps. Each is shifted out with the `translate` property when it fits beside the dock (a bottom bar, a floating button), or shrunk to end at the dock's edge otherwise (a full-width header, a full-height panel). The change is kept only if the element then clears the dock; otherwise it is reverted and the element is left alone. Adjusted elements are re-checked against their unadjusted box on every re-measure, and restored when the dock closes, moves or no longer covers them.
- Limit: the window can't be narrowed from inside the page, so media queries and `vw` still see the whole window, and a wide layout gets squeezed instead of switching to its narrow form.

### D18. One panel at a time in a narrow HUD

The Components tab stacks the tree and details as two panels on a sliding track when the HUD is docked at the side, or when its own width is under 700px (a narrow floating window or dock). Both panels stay mounted, so the tree keeps its scroll position. Selecting a row slides to the details; their header shows the ancestor path from the tree (each ancestor selects that instance) and a back control, which returns to the tree and reveals the selected row. A pick in the page goes straight to the details. The slide is a CSS transform transition, turned off under `prefers-reduced-motion`.

### D19. Floating replaces the popup window

The popup window could open as a tab (a full-screen browser does that, and a leftover tab holding the window name gets reused at its size), needed its own reload handling, and duplicated the HUD's lifecycle outside the page. Floating keeps the one frame and moves it: `edge: 'float'` joins the dock's resolved state, with `floating` and a persisted `float` rect. The drag bar, corner handle and minimized button are page-side nodes, because a drag that starts inside the frame loses its pointer once it leaves the frame. Every edge and corner resizes the window, moving only the dragged sides, since a window parked against a viewport corner can only grow away from it. A floating window reserves no page space and stays inside the viewport on resize. Its rect lives in local storage under its own key (`loom-devtools:hud`), apart from the dock's settings, so it outlasts the session. The minimized button is round and shows only the loom logo (its name is in its label and tooltip), appears inset in the bottom-right corner every time, follows a drag freely and snaps into the nearer bottom corner on release; its corner isn't stored. Restoring returns the window to where it was last expanded. `open()` without a placement reopens where the HUD was last. Core marks the tab while the HUD is open and reopens it on the next load; the backend clears the mark on close through a `DevtoolsHost` passed to `activate`, since core can't see the HUD's close control. Removing `popup` changes the protocol's allowed values, so the protocol major goes to 2. Alternatives: keep the popup alongside floating, which keeps the tab and reload problems; or let the HUD's own toolbar drag the frame through messages, which drops moves while the frame holds the pointer.

### D20. Component props resolve to their instances in core

`instanceOf(value, owner)` walks the contexts under the instance whose props hold the value, finds the slot whose last applied value is that same component value (or an array holding it), and returns the child context the slot rendered it into, keyed as the list reconciler keys items; only a live component instance counts. It runs only when devtools encodes props, so rendering pays nothing, and it works for values rendered before devtools connected. The backend adds the instance's id to an encoded component value, and the HUD turns it into a link with hover outline, like tree rows and path links. Alternatives: record each value's instance on every render, which an A/B benchmark showed costs about 100KB of heap and a few percent on several operations whether devtools is on or not; or match by template and props, which is ambiguous for repeated components with equal props. A value rendered through an activity effect's own scope isn't found and stays plain text.

## Risks / Trade-offs

- [Padding changes layout for pages that style `html` padding or use `100vh` against `html`] → The padding is applied only while docked, previous inline values are restored, and collapse lets the user shrink it.
- [Regex injection mislabels an unusual declaration] → Matches are anchored to `=` followed directly by the `activity` or `own(() => activity` callee. The worst case is a wrong but harmless label, and an explicit `label` always wins.
- [The `__loomLabelActivity` wrapper costs a call per activity creation] → It is injected only when name injection is active (dev, or `'lazy'` builds), the same gate as component names.
- [Edge chips overlap app UI near the dock] → Chips are small, use `pointer-events` only on themselves, and disappear when the hover or selection clears.

## Migration Plan

Ship as minors of `@loom-js/devtools`, `@loom-js/core` and `@loom-js/build` through changesets. One break: `open('popup')` becomes `open('float')` (D19); there is no alias.
