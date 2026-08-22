---
'@loom-js/core': patch
---

Table-aware template parsing — templates rooted at a table-part tag (`tr`, `td`, `th`, `thead`, `tbody`, `tfoot`, `caption`, `colgroup`, `col`) keep their authored root instead of being stripped by body-context parsing, and interpolations directly inside `table`/sections/`tr`/`colgroup` render in place instead of being foster-parented out of the table. Heals `el('tr')`/`el('td')`-style components, dynamic row lists, and Contentful rich-text tables; browser and server (linkedom) renders now agree on table markup. Table-free templates parse exactly as before.
