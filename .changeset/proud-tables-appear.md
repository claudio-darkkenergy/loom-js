---
'@loom-js/pink': minor
---

Add `PinkTable` — a compound table component over the upstream appwrite/pink `.table*` styles: `PinkTable` (root, with the upstream layout/scroll/vertical modifiers) plus `Head`/`Body`/`Foot`, `Row`, `HeadCol`/`Col`, and `Wrapper` sub-components, all `is`-polymorphic. Rendering table-part roots and dynamic row lists requires `@loom-js/core`'s table-aware template parsing (first published in the release containing that fix); on older cores, table markup degrades exactly as it did before that fix.
