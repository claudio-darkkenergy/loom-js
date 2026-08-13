---
'@loom-js/core': patch
---

Refactor special-attribute dispatch in `get-attr-update.ts` from a `switch(true)` to a factory map (`specialAttrUpdaterFactories`) with event/default fallbacks — behavior unchanged; new special attribute types now extend the map without touching dispatch logic.
