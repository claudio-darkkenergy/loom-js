---
'@loom-js/core': patch
---

`route()` now leaves every modified or already-consumed link activation to the browser. Previously only ctrl/cmd-clicks were excepted; shift-clicks (new window) and alt-clicks (download) were hijacked into an in-place SPA navigation, and events another handler had already `preventDefault()`ed were re-claimed. The guard now covers `ctrlKey`, `metaKey`, `shiftKey`, `altKey`, and `defaultPrevented`. Middle-clicks were never affected (they fire `auxclick`, not `click`).

Internal: the `Router` class's route matching and param extraction moved into pure module-level helpers (`matchRoute`, `extractParams`) with no public API change, resolving the file's standing SRP audit entry.
