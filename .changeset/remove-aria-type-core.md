---
'@loom-js/core': minor
---

**Breaking:** the `Aria` type is no longer exported. Core never consumed it; ARIA attributes are passed through the `attrs` reserved prop (`attrs=${{ 'aria-label': 'Close' }}`).
