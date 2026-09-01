# Tasks — docs-pink-section

## 1. Sequencing gates

- [ ] 1.1 Confirm `docs-feedback-topic` (trailing-topics allowance) has landed; note whether `docs-grouped-side-nav` has (group placement) — proceed with the matching nav shape

## 2. Map (review gate)

- [ ] 2.1 Write the pink content map: topic partition proposal, per-topic outlines, source pointers (`packages/pink/src/**`, stories), carried conventions (pink-named examples, code-sample rules)
- [ ] 2.2 Maintainer reviews the map — no entry work before sign-off

## 3. Content

- [ ] 3.1 Author topics in `contentful-sync/`-style sources; push as drafts; maintainer reviews
- [ ] 3.2 Create the group/listing entries per the nav shape from 1.1 (drafts)

## 3b. Package card

- [ ] 3b.1 Write `packages/pink/README.md` as the npm card (purpose/layering paragraph, install, one example, docs-home + Storybook links); no API reference

## 4. Publish & verify

- [ ] 4.1 Publish with the listing; verify nav placement, topic rendering, Storybook links
- [ ] 4.2 Verify against `docs-pink-coverage`: topics match the map; drift obligation recorded in the map header
