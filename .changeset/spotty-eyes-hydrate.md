---
'@loom-js/core': minor
---

Add client hydration for pre-rendered pages: `hydrate({ app, root, globalConfig, onAppMounted, ready, maxWait })` boots on top of server-rendered markup with a single atomic swap once the app has settled — lazy route content and async activity work included — so the takeover is invisible (no shell/fallback flashes). The new `settled()` export is the underlying quiescence signal: it resolves when no framework-mediated async work (thenables returned by activity transforms) is pending for the current window, confirmed by one macrotask of quiet. `renderToString` → `hydrate` is now the complete pre-rendering story; `init`-only apps pay no bytes for it.
