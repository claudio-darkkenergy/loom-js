# Tasks — align-loom-docs-with-core-readme

## 1. Content map (review gate)

- [x] 1.1 Write `content-map.md` in this change dir: per D1's 13 topics — slug, title, side-nav order, source README headings, per-topic h2/h3 outline, code samples carried over, cross-topic links, and any rich-text conventions used (e.g. quote→callout)
- [x] 1.2 Flag the `bootstrapping`, `routing`, and `lazy-imports` entries per D7 (authored last, post `core-api-follow-ups`; or authored as-is and flagged for a parity follow-up) — resolved: `core-api-follow-ups` landed (`542dd65`) & is archived, so the map authors all three from the current README with no deferral flag
- [x] 1.3 Maintainer reviews the content map — no Contentful entry or component work starts before sign-off (signed off 2026-08-21; all three open points approved as proposed)

## 2. Component inventory (approval gate)

- [x] 2.1 From the reviewed map, inventory every UI need and resolve each to: existing pink export / pink composition / upstream-port candidate — with a named composition fallback for every candidate (see `component-inventory.md`)
- [x] 2.2 Present each upstream-port candidate (anticipated: `alert` for callouts, `table`) to the maintainer individually for approval; record each verdict in the inventory — verdicts: `PinkTable` approved, `PinkInlineCode` approved, `PinkAlert` deferred (task 3.2 uses the blockquote-rooted composition fallback; revisit after visual check)
- [x] 2.3a Port `PinkInlineCode` into `packages/pink` (`<code>` root + `.inline-code` class) with Storybook story and a minor changeset
- [x] 2.3b Port `PinkTable` into `packages/pink` (markup over `.table*` classes) with Storybook story and a minor changeset — unblocked by (and built on) the `table-aware-template-parsing` core change; compound component with `Head`/`Body`/`Foot`/`Row`/`HeadCol`/`Col`/`Wrapper`, all `is`-polymorphic delegators

## 3. Docs rendering upgrades (apps/loom)

- [x] 3.1 Extend `StyledRichText` (or a docs-scoped wrapper) for multi-line code samples: `PinkCodePanel` with line numbers and a language/header label as the map requires — `lib/code.ts` (`asCodeBlock` + `CodeSample`, `// @lang` directive, single-line rule recorded in the map); inline code → `PinkInlineCode`
- [x] 3.2 Map `BLOCKS.QUOTE` → callout rendering (approved pink port, or the pink composition fallback) — blockquote-rooted `PinkCard` (PinkAlert deferred per inventory)
- [x] 3.3 Render rich-text table blocks through the approved table treatment (pink port or composition) — `lib/table.ts` maps TABLE/ROW/CELL blocks to `PinkTable` with header/body partitioning + scroll wrapper
- [x] 3.4 Route in-content `/docs/<slug>` hyperlinks through `onRoute` so cross-topic links navigate client-side — `INLINES.HYPERLINK` with an internal (`/`-prefixed) uri renders `RouteLink`; external links keep the anchor
- [x] 3.5 Build `TopicPagination` from the `page` listing + current topic slug (prev/next, no dead links at boundaries) and mount it in the docs topic view — mounted in `pages/docs/index.ts` under a `page` effect + `routeEffect`
- [ ] 3.6 Verify side nav renders the new topic set in map order with correct selected state (adjust `DocsSideNav` only if the listing shape changed) — structural review done (listing order + `isSelected` unchanged); needs the phase-4 entries live to verify against the map
- [x] 3.7 Route docs/home content loads through core's `resource(key, fetcher)` inside their activity transforms with stable keys (e.g. `page-content:<pageSlug>:<topicSlug>`, `site`), per D8 — new `pageContent` activity (`logic/activity/page-content.ts`) owns the fetch in its transform via `resource('page-content:<pageSlug>:<topicSlug>')`, fanning out to `page`/`topic`; failures throw so `resource` retries. Home is static today and `site` is unfetched — the `site` key stays reserved

- [x] 3.8 Copy code: `PinkCopyToClipboard` behavior (`packages/pink/src/behaviors/`), `PinkCopyButton`, `PinkCodePanel.CopyButton`; `withIcon`/`PinkButton` accept an `AttrBinding` icon; core exports `isAttrBinding` — minor changesets (pink, core). Verified: same icon node across the copy cycle (class-only mutation), tooltip label in place, 2s revert
- [x] 3.9 Heading link anchors: `AnchoredHeading` + `headingAnchorId` (one kebab helper shared with the TOC convention); `<a href="#id">` via `route()`, copies the absolute URL; ids match TOC hrefs on all headings (verified on element-syntax)
- [x] 3.10 Rich-text fixes: `PinkInlineCode` template whitespace (patch changeset); block rhythm for code panels/callouts/tables; reference tables wrap; `i` back to italic; hover underline scoped to text links; smooth anchor scroll (reduced-motion aware); the legacy `.richText code` background override removed (it had been masking upstream pink's undefined dark panel background)
- [x] 3.11 Sample conventions: 2-space re-indent at push time (`md2rich.py`), `*` block comments, result annotations never below their line, HTML comments instead of `${'' /* … */}` — README + topic sources + drafts re-pushed
- [x] 3.12 Default topic → `/docs/getting-started` (`use-docs-layout.ts`, home CTA); `get-started` retired without a redirect (map updated)

## 4. Contentful entry

- [x] 4.1 If (and only if) the map demands a field the model lacks and no rich-text convention covers it, make the minimal content-model change and record it in the map
- [ ] 4.2 Author/update the 13 topic entries in Contentful per the map — learning-path order, outlines, code samples, cross-links (defer the three D7-flagged topics until `core-api-follow-ups` lands, or enter as-is and keep the flag) — entered 2026-08-28 as **drafts** via `contentful-sync/` (10 created, 3 updated in place); model needed no change (4.1). Pending maintainer review, then listing reorder + publish
- [ ] 4.3 Retire or re-home stale pre-scrub topics so the listing contains exactly the mapped set

## 5. Verification

- [ ] 5.1 Load every `/docs/<slug>` route and check content against the map: outline, code samples, anchored headings/on-page TOC, callout and table rendering
- [ ] 5.2 Exercise IA behaviors: side-nav order + selected state, prev/next at middle and boundary topics, cross-topic links navigating client-side (no full reload)
- [ ] 5.3 Confirm API parity per `docs-content-coverage`: signatures/props/defaults in each topic match the current README; resolve or explicitly flag the D7 topics
- [ ] 5.4 `pnpm -F @loom-js/loom type-check` green; if pink changed: `pnpm -F @loom-js/pink type-check` green and changeset present; `pnpm format` over touched files
- [ ] 5.5 Sanity-check no regressions against existing docs specs (toggle behavior, single-request content loads, skeleton/error states)
- [ ] 5.6 Prerender-readiness audit per D8: no bare `window`/`document` access at module scope or in the render path of new/touched components (browser-only APIs only in `onMounted`/event handlers); spot-check a docs topic serializes via `renderToString` + linkedom without throwing
