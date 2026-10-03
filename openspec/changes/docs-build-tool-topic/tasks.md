# Tasks — docs-build-tool-topic

## 1. Gate

- [x] 1.1 Confirm `server-first-loom-app` has landed and the build pipeline is stable (do not proceed before) _(2026-10-01: archived 2026-09-15; `restore-sandbox-build` 2026-09-29 was the last build touch)_
- [x] 1.2 Confirm `loom-build-tool` has landed (`@loom-js/build` and `@loom-js/esbuild-plugin-html-split` published) — the topic's source (D2, resolved 2026-10-01)

## 2. Content

- [x] 2.1 Outline the topic from `@loom-js/build` (`loom.config.ts` + `defineConfig`, `loom build` / `loom dev` / `loom prerender`, mode, routes + shells, prerender hooks, `esbuild` escape hatch, the plugin as the raw path, one pointer to future bundler adapters); maintainer reviews the outline
- [x] 2.2 Author in `docs/topics/`, re-slug the entry to `build-tool`, push as draft; maintainer reviews
- [x] 2.3 Insert into the `/docs` listing tail before `feedback`; publish

## 3. Verification

- [x] 3.1 `/docs/build-tool` renders per the outline; nav/pagination derive correctly; content spot-checked against the plugin and app build source
