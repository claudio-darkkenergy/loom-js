---
'@loom-js/core': patch
---

A component that unmounts and mounts again now runs the life-cycle handlers registered by its new render. Before, the handlers from its first render kept firing, so an `onCreated` that updated a locally created activity updated the old one and the remounted template never changed.
