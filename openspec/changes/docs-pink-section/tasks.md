# Tasks — docs-pink-section

## 1. Sequencing gates

- [x] 1.1 Confirm `docs-feedback-topic` (trailing-topics allowance) has landed; note whether `docs-grouped-side-nav` has (group placement) — proceed with the matching nav shape _(2026-10-04: both archived — 2026-09-21 and 2026-09-26; nav shape is a sixth "Pink" group after Reference, with the `docs-information-architecture` MODIFIED delta added to this change)_

## 2. Map (review gate)

- [x] 2.1 Write the pink content map: topic partition proposal, per-topic outlines, source pointers (`packages/pink/src/**`, stories), carried conventions (pink-named examples, code-sample rules) _(2026-10-04: `docs/pink-content-map.md` — six topics proposed; the two `decide` items and the depth rule await 2.2)_
- [x] 2.2 Maintainer reviews the map — no entry work before sign-off _(2026-10-04: "ship it" — recommendations stand: Pink group last, six topics, the depth rule)_

## 3. Content

- [x] 3.1 Author topics in `contentful-sync/`-style sources; push as drafts; maintainer reviews _(2026-10-04: `docs/topics/17-pink.md` … `22-pink-code-panels.md`; all 29 `ts` samples type-check against the workspace packages; pushed as drafts, ids in `ids.json`)_
- [x] 3.2 Create the group/listing entries per the nav shape from 1.1 (drafts) _(2026-10-04: group entry `iMRdec1x9OpnTC04r2QTg` "Docs nav group: Pink" linking the six topics; appended to the `/docs` page listing after Reference)_

## 3b. Package card

- [x] 3b.1 Write `packages/pink/README.md` as the npm card (purpose/layering paragraph, install, one example, docs-home + Storybook links); no API reference _(2026-10-04; patch changeset so it reaches npm)_

## 3c. Pink fixes from the map

- [x] 3c.1 Export `Tokenize`, `CodeToken`, `TokenizeActivity`, `PinkCodePanelContentProps` from the package; retitle the `PinkActionBar` story under `Components/`; fix the code-panel story's tokenizer comment — patch changeset _(2026-10-04)_
- [x] 3c.2 Make every `usePinkTheming` knob apply: `--avatar-bg-color` fallback in `_avatar.scss` (both themes), `--card-bg-color` fallback in the card's dark block, `textColor` → `--p-body-text-color` + root `color`; new `cardPaddingMobile` knob — patch changeset _(2026-10-04)_

## 4. Publish & verify

- [x] 4.1 Publish with the listing; verify nav placement, topic rendering, Storybook links _(2026-10-04: six topics + group + page published together; a production `loom build` in preview mode prerendered all 25 routes with `validate` passing — Pink is the sixth group, open on its topics, `feedback` paginates forward to `pink`, every cross-linked anchor resolves, `llms.txt` lists the group; Storybook at `loom-js-pink.vercel.app` answers 200)_
- [x] 4.2 Verify against `docs-pink-coverage`: topics match the map; drift obligation recorded in the map header _(2026-10-04: six slugs and outlines as mapped; export coverage covers every `src/index.ts` export; the map header carries the drift obligation and the per-topic source/story pointers)_
