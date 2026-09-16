---
'@loom-js/core': patch
---

Boot scrolling has one owner again: the router's boot-owed scroll (URL fragment or captured offset) now waits for any in-flight hydration to complete, so it always targets the post-swap layout — previously that ordering held only by scheduling accident. `hydrate`'s own interim fragment realign is removed with it; it existed to paper over the race and could fight app-level scroll behavior.
