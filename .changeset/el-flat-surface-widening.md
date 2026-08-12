---
'@loom-js/core': minor
---

`el(tagName)` widens its flat prop surface to match what the retired `@loom-js/tags` wrappers exposed, so converted delegators pass one shape to any root: `id` and `style` now map to their attributes alongside `className` (previously they only worked via `attrs`), and `onClick` binds the click listener (previously clicks required `on: { click }`). `PossibleAttrs` also admits `StyleProp` values on the type level — the runtime already handled style arrays in `$attrs`.
