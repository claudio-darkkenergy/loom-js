# Tasks — readme-slim-down

## 1. Gates

- [ ] 1.1 Confirm `align-loom-docs-with-core-readme` is published/archived and `server-first-loom-app` has landed (prerendered topic URLs live) — hard stop before both

## 2. Re-anchor

- [ ] 2.1 Produce the re-anchored map artifact: per topic, outline + source pointers into `packages/core/src/**`/tests (supersedes the README-heading mapping)
- [ ] 2.2 Write the `docs-content-coverage` delta (propagation fires on core changes; anchor = map + source pointers) — pair with the `core-readme-accuracy` delta in this change

## 3. The cut

- [ ] 3.1 Rewrite `packages/core/README.md` to D1's scope (pitch, linked highlights, install/inclusion, quick example, Documentation section, Recognition)
- [ ] 3.2 Verify: links resolve against the live site; the quick example type-checks; `pnpm format`
- [ ] 3.3 Maintainer reviews the slim README before commit
