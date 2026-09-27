# Tasks — docs-ia-discoverability

## 1. Gates

- [x] 1.1 Confirm align-phase-4 is published (slugs/anchors live) and the `docs-grouped-side-nav` grouping outcome is known — hard stop before both _(cleared 2026-09-26: all 13 topics + the 5 group entries are PUBLISHED in Contentful; grouping = Onboarding / Templating / Reactivity / Server-first / Reference, so `fragments` joins Templating between `element-syntax` and `custom-elements`)_

## 2. Sweep (review gate)

- [x] 2.1 Sweep all 13 topics for discoverability failures (prose-only concepts, mechanism-titled headings, split material); write `sweep.md` with per-candidate verdicts, seeding the known set (element bindings — heading _and_ coverage gap, functional components, fragments, settlement signal, transform time, `el()`) _(written 2026-09-26 — 8 seeded + 8 new candidates, 4 pre-conditions, 5 review questions)_
- [x] 2.2 Maintainer reviews sweep verdicts — no restructuring before sign-off _(signed off 2026-09-26: Q1 land `toc-sub-section-links` before 4.2; Q2 leave the plain-element `$name` fallback unstated; Q3 settlement signal home = Activities; Q4 both promotions approved; Q5 `fragments` slug + outline approved)_

## 3. Restructure

- [x] 3.1 Components: "Functional components" h2 (h3s: Simple components, Plain functions) per D1 — README + topic + map outline; cross-links updated _(2026-09-26: h3 order Plain functions → Simple components, the contract first; `SuperButton` moved out of the examples comment; `#simple-components` redirect note in the map)_
- [x] 3.2 Fragments topic per D2: outline in the map (multi-passage source pointers recorded), README passages consolidated, vacating sites get pointers; draft authored and pushed _(2026-09-26: `05a-fragments.md` authored; README `### Fragments` consolidated before Custom elements; 8 vacating sites pointed; map entry 5a + Templating group; draft entry `51JTY5UgXSus9k2T0Yo1yW` created — group relink rides 4.1. Probe fixes: `Pair` example `// => 2` was wrong — handlers get whitespace text nodes too)_
- [x] 3.3 Apply the remaining approved sweep verdicts (each as README + topic + map edits); give each confirmed lookup surface its See also block from the sweep's site inventory (D2b), recorded in the map's cross-link registry _(2026-09-26: Element bindings h2 (+4 h3s), The settlement signal h2, Transform time h2, `routeProps` h3, Component-scoped state → h2, `label` bullet, Happy DOM parity (P5), pointers in Configuration / Custom Elements / Element Syntax / Hydration / Server Rendering; See also blocks on Element bindings + The settlement signal, Built-in props' set extended; map outlines synced (P3) + cross-link registry; drafts pushed; patch changeset added)_

## 4. Publish & verify

- [x] 4.1 Standing draft review; publish topic + listing changes together _(2026-09-27: content approved after review fixes (per-binding examples, complete samples, Transform time rewording, `routeProps` example); 15 topics + the Templating group (now linking `fragments`) published together)_
- [x] 4.2 Verify: new headings in TOC/nav, pointers resolve, no dead anchors (crawl the cross-link set); parity checks green (`core-readme-accuracy` examples, coverage map) _(2026-09-27 partial: published listing flattens to the map order with `fragments` in Templating; all 5 new h2 anchors + the 5 fragments h2s present (TOC derives from h2s); 137 published internal links resolve against computed h2/h3 ids; coverage map + registry updated; new README samples type-check except the two core type gaps (sweep P8/P9, owned by `fragment-root-inference`). **Open:** 5 distinct links target h3 anchors and stay dead on the live site until `toc-sub-section-links` lands — re-run the crawl then and close)_ _(closed 2026-09-27: `toc-sub-section-links` implemented — the five h3-targeted links resolve live)_
