---
'@loom-js/pink': minor
---

**Breaking:** `PinkButton` and `PinkToggleButton` items no longer take an `aria` prop. ARIA attributes are passed through `attrs` (`attrs=${{ 'aria-label': 'Close' }}`), which both components apply to the rendered element. An `aria` prop passed from untyped code is ignored, so its label stops rendering.
