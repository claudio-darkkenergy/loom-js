# Tasks — docs-grouped-side-nav

## 1. Grouping review (gate)

- [x] 1.1 Maintainer signs off the group partition and group names; record the outcome in the align change's content map amendments — no entry or component work before _(signed off 2026-09-25: five groups — Onboarding / Templating / Reactivity / Server-first / Reference (Reactivity shortened from "Reactivity & Routing", 2026-09-26); collapsible sections via the ported upstream Collapsible markup; recorded in the content map)_

## 2. Nav component

- [x] 2.1 `PinkCollapsible` port (upstream Collapsible markup — `<details>`/`<summary>` over the shipped `.collapsible` classes; approved 2026-09-25) + `PinkSideNav` `top` and `PinkDropList.Item` for the composition
- [x] 2.2 `DocsSideNav` renders groups as collapsibles (flat listings keep rendering flat); the selected topic's group open from the matched route

## 3. Data

- [x] 3.1 Extend the listing GraphQL fragment one nesting level; update the `page` activity fan-out and the flatten helper (D3); `TopicPagination` reads the flattened order
- [x] 3.2 Create the group `content` entries (title, one-line description, topics in order) and relink the `/docs` page to groups — drafts, maintainer reviews

## 4. Verification

- [x] 4.1 flatten(groups) equals the content map's order (assertion + spot check); prev/next crosses group boundaries correctly
- [x] 4.2 Grouped listing and open-group state in server-rendered markup match the browser's initial render (linkedom parity); toggles work (native disclosure); selected-topic marking correct per route
- [x] 4.3 Note the flattened-listing read in `server-first-loom-app`'s enumerator task; `pnpm -F @loom-js/loom type-check`; `pnpm format`
