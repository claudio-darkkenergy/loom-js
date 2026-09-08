# Tasks — docs-grouped-side-nav

## 1. Grouping review (gate)

- [ ] 1.1 Maintainer signs off the group partition (proposal's six groups) and group names; record the outcome in the align change's content map amendments — no entry or component work before

## 2. Nav component

- [ ] 2.1 Accordion nav-group composition (per `docs-component-sourcing`: pink composition first — `PinkDropList` / `.drop-section` candidates; port only via approval), `<button aria-expanded>` header + labelled region, expansion via a per-instance activity `bind`
- [ ] 2.2 `DocsSideNav` renders groups (flat listings keep rendering flat); active group expanded from the matched route

## 3. Data

- [ ] 3.1 Extend the listing GraphQL fragment one nesting level; update the `page` activity fan-out and the flatten helper (D3); `TopicPagination` reads the flattened order
- [ ] 3.2 Create the group `content` entries (title, one-line description, topics in order) and relink the `/docs` page to groups — drafts, maintainer reviews

## 4. Verification

- [ ] 4.1 flatten(groups) equals the content map's order (assertion + spot check); prev/next crosses group boundaries correctly
- [ ] 4.2 Active-group expansion in server-rendered markup matches the browser's initial render (linkedom parity); toggles work post-hydration; aria-expanded/region semantics pass a screen-reader spot check
- [ ] 4.3 Note the flattened-listing read in `server-first-loom-app`'s enumerator task; `pnpm -F @loom-js/loom type-check`; `pnpm format`
