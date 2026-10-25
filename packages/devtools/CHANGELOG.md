# @loom-js/devtools

## 0.1.0

### Minor Changes

- d4cb8bd: First release, as a preview: the loom inspector. A live component tree with names, keys, activity boundaries and render counts; an inspector for props, activities, life-cycle state and owned values; an element picker and hover/selection outlines in the page; render flashing; live editing of JSON activity values; "log to console" as `$loom`; custom console formatters; and Chrome Performance-panel tracks. The HUD docks in the page or pops out to its own window with no browser extension, and talks to the in-page backend over a versioned, same-origin `postMessage` protocol. Loaded on demand through `loom.devtools.enable()`, which also adds `loom.tree()`, `loom.inspect(node)` (pair with DevTools' `$0`) and `loom.activities()` to the console.
