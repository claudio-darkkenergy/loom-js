---
'@loom-js/build': minor
---

`loom dev` now serves the files your prerender hooks generate, such as a search index or `llms.txt`. Before, only a production build wrote them, so features that depend on them were broken in dev.

**Breaking:** to make that possible, `prerender.after` is renamed to `prerender.artifacts({ bundle, outDir, mode })` and now runs in every command: after the routes in a production `loom build` and `loom prerender`, in a development `loom build`, and in `loom dev`. Rename the key in your config; there is no alias.

`loom dev` loads the prerender bundle and runs `setup` and `artifacts` on start, after every successful rebuild and when you type `r` + Enter. The generated files are served at their production paths. Each run uses a fresh worker, so hooks always see current code and config. `loom dev --prerender` also renders every route, so prerendered pages and hydration can be tested with live reload. In dev a failing hook logs a `[loom dev]` warning and the server keeps serving; builds still fail.

`dev()` now takes `{ prerender }` and returns `refresh()` and `stop()`. Pass `configFile` to `resolveConfig` so `dev()` can reload the config for each run.
