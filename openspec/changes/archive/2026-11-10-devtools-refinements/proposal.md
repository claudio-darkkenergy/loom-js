# Devtools Refinements

## Why

Using the first `@loom-js/devtools` release (0.1.0, shipped as a preview) on real apps turned up rough edges. The dock hides the page under it. Outlines draw over the HUD. Activities show up as `activity#n`. Render counts don't explain themselves. Logging an activity prints its method surface. This change collects those refinements. The list is open: more refinements found after these land will be added to this same change, not to a new one.

## What Changes

- **Dock reserves its space**: while docked, the page can scroll all of its content clear of the HUD. The dock can be resized and collapsed to a bar.
- **Pop out floats over the page**: the separate popup window is replaced by the same HUD floating over the page, moved by a drag bar, resized from a corner and minimized to a small button. `open('popup')` becomes `open('float')`. **BREAKING** for `DevtoolsPlacement` and the devtools protocol (version 2).
- **Component props link to their instances**: a prop holding a component (`children`, a named slot, an `el()` element) and each ancestor in the selected instance's path outline the instance on hover and select it on click.
- **Outlines stay out of the HUD**: hover, selection and flash outlines are clipped to the part of the page that is actually visible. An instance hidden behind the dock, or scrolled out of view, gets an edge indicator pointing toward it. Clicking the indicator scrolls the instance into view.
- **Picking reveals the tree row**: an instance picked from the page has its collapsed ancestors expanded, and its row is scrolled into view.
- **Render counts read clearly**: the badge says what it counts (re-renders since devtools connected), and the counts can be reset.
- **Inline activity editing**: an editable value is edited in place, both in the Activities tab and in the component inspector. This replaces the separate input and Set button.
- **Activities have names**: the build tool labels activities from their binding (`const count = activity(0)` becomes `count`), including bindings inside component bodies and `own(() => activity(…))`. An explicit `label` wins. Unbound activities fall back to their owning instance's name.
- **Activities show their scope**: the HUD shows whether an activity is owned by a component instance, and which one, or is not owned by any instance.
- **Logging an activity is useful**: the log action prints a plain snapshot (name, value, pending, scope, subscribers) that reads well without custom formatters. The live handle is attached for driving it from the console.

## Capabilities

### New Capabilities

- `activity-display-names`: how an activity gets the name devtools and diagnostics show. This covers the explicit label, build-injected labels and the owner-qualified fallback.

### Modified Capabilities

- `devtools-inspector`: dock space reservation, resize and collapse, floating in place of the popup, component-prop and path links, clipped outlines with edge indicators, pick-reveal in the tree, render-count labeling and reset, inline activity editing, activity scope display, and the logged activity snapshot.
- `devtools-introspection`: activity discovery also reports each activity's owning instance, and component values resolve to the instances they rendered.
- `devtools-protocol`: the reconnect requirement no longer describes a popup window.
- `build-tool-config`: name injection covers activity labels as well as component names.

## Impact

- `packages/devtools`:
    - `backend/hosts.ts`: dock sizing, space reservation, collapse, floating window.
    - `backend/page-layer.ts`: clipping and edge indicators.
    - `backend/index.ts` and `backend/inspect.ts`: scope in activity records, the log snapshot.
    - `protocol/types.ts`: additive fields, then version 2 when `popup` leaves the placements.
    - `frontend/`: tree reveal, render-count badge, inline editor, scope display.
    - Minor changeset.
- `packages/core`: `@loom-js/core/devtools` gains `nameActivity` and `instanceOf`, and the router and `lazyImport` label the activities they create. `DevtoolsPlacement` becomes `'dock' | 'float'`. Minor changesets (core is pre-1.0).
- `packages/build`: `devtools-plugin.ts` injects activity labels. Minor changeset.
- Docs: the `devtools` topic (HUD behavior, logging) and `build-tool` (what gets named). Push = publish to Contentful at ship.
