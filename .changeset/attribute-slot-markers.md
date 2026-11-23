---
'@loom-js/core': patch
---

SVG attributes bound in a template (`x=${x}`, `d=${d}`, `viewBox=${box}`) no longer log browser parse errors. Attribute slots now parse as valueless marker attributes, and every dynamic attribute is stripped from the cached template, so no attribute is ever parsed or cloned holding the slot placeholder.
