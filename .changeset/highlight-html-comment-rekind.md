---
'@loom-js/highlight': patch
---

HTML comments inside template literals (`<!-- … -->` in an `html`-tagged template) tokenize as `comment` instead of inheriting the template string's kind, so annotations render in comment styling.
