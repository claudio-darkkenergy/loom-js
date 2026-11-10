---
'@loom-js/core': minor
---

`DevtoolsPlacement` is now `'dock' | 'float'`: devtools floats over the page instead of opening a separate window, and `'popup'` is gone. `loom.devtools.open()` without a placement opens the HUD where it was last, and an open HUD reopens on the next load of the tab until the devtools implementation reports it closed through the new `DevtoolsHost` that `activate(host)` receives. `@loom-js/core/devtools` adds `instanceOf(value, owner)`, the live instance a component value held in `owner`'s props rendered into, which devtools uses to link a `children` or slot prop to what it rendered.
