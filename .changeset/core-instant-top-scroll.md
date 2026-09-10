---
'@loom-js/core': patch
---

Fragmentless navigations now scroll to the top immediately when the navigation commits, instead of waiting on the settlement signal. Deferring the top scroll left the viewport parked mid-page over stale or loading content until the new route's data landed; only fragment scrolls still wait for settled content, since their target has to exist. `route(event, { scroll: false })` continues to suppress both.
