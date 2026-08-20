---
'@loom-js/core': patch
---

Fix the array-reconciliation limitation: a fragment-rooted value (a named-slot region or a rootless `<>` fragment-template component) passed as an item of a children array now renders its nodes instead of stringifying to `"[object Text],[object HTMLDivElement]"`. Each such item reconciles as one group — reorders move all of its nodes together with node identity preserved for keyed items, truncation removes the whole group, kind changes (fragment ⇄ element ⇄ text) fully replace the previous rendering, and an item that resolves to zero nodes keeps an empty text anchor so a later update fills back in at the right position. Interpolating a region directly and passing it as a children-array item are now equivalent; no API change.
