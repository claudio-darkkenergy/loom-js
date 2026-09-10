---
'@loom-js/core': patch
---

Scroll-restoration offsets now capture when scrolling comes to rest (`scrollend`, with a debounced scroll fallback) instead of at `pagehide`, which Chrome silently ignores for history writes — reload restoration works now, and a captured offset clears once the entry rests back at the top so a stale depth can never restore.
