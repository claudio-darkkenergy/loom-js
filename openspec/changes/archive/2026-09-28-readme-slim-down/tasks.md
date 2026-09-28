# Tasks — readme-slim-down

## 1. Gates

- [x] 1.1 Confirm `align-loom-docs-with-core-readme` is published/archived and `server-first-loom-app` has landed (prerendered topic URLs live) — hard stop before both

## 2. Re-anchor

- [x] 2.1 Produce the re-anchored map artifact: per topic, outline + source pointers into `packages/core/src/**`/tests (supersedes the README-heading mapping)
- [x] 2.2 Write the `docs-content-coverage` delta (propagation fires on core changes; anchor = map + source pointers) — pair with the `core-readme-accuracy` delta in this change

- [x] 2.3 Port the README passages no topic carried into the topic sources: template whitespace (`components`), `createRoutes` `assets` (`routing`), the `primeResources` / `serializeState` envelope (`dehydrated-state`); push drafts
- [x] 2.4 Publish every pending topic draft (`lazy-imports` included); `routing` publishes with `route-search-params`

## 3. The cut

- [x] 3.1 Rewrite `packages/core/README.md` to D1's scope (pitch, linked highlights, install/inclusion, quick example, Documentation section, Recognition)
- [x] 3.2 Verify: links resolve against the live site; the quick example type-checks; `pnpm format`
- [x] 3.3 Maintainer reviews the slim README before commit
