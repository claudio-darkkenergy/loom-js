# Tasks — docs-build-tool-topic

## 1. Gate

- [ ] 1.1 Confirm `server-first-loom-app` has landed and the build pipeline is stable (do not proceed before)

## 2. Content

- [ ] 2.1 Resolve the wrapper question first (design D2: build-package proposal or current wiring), then outline the topic from whichever shipped (entrypoints, `htmlSplit` shells + dynamic chunks, prerender + state scripts); maintainer reviews the outline
- [ ] 2.2 Author in `contentful-sync/topics/`, re-slug the entry to `build-tool`, push as draft; maintainer reviews
- [ ] 2.3 Insert into the `/docs` listing tail before `feedback`; publish

## 3. Verification

- [ ] 3.1 `/docs/build-tool` renders per the outline; nav/pagination derive correctly; content spot-checked against the plugin and app build source
