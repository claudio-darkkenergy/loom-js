---
'@loom-js/core': patch
---

Fix a stray literal `null` text node serialized ahead of every compiled component-element region (children and named slots) under `renderToString`/`renderToStringSync`. The rootless-template cleanup assigned `textContent = null` when the fragment marker was the whole first static; browsers treat that as `''`, linkedom stringifies it. Compiled regions now serialize byte-identical to the browser's rendering of the same template — region content in place, no artifact nodes, absent regions rendering nothing — and the server suite pins that parity.
