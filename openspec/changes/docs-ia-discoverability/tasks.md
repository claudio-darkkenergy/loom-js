# Tasks — docs-ia-discoverability

## 1. Gates

- [ ] 1.1 Confirm align-phase-4 is published (slugs/anchors live) and the `docs-grouped-side-nav` grouping outcome is known — hard stop before both

## 2. Sweep (review gate)

- [ ] 2.1 Sweep all 13 topics for discoverability failures (prose-only concepts, mechanism-titled headings, split material); write `sweep.md` with per-candidate verdicts, seeding the known set (element bindings — heading _and_ coverage gap, functional components, fragments, settlement signal, transform time, `el()`)
- [ ] 2.2 Maintainer reviews sweep verdicts — no restructuring before sign-off

## 3. Restructure

- [ ] 3.1 Components: "Functional components" h2 (h3s: Simple components, Plain functions) per D1 — README + topic + map outline; cross-links updated
- [ ] 3.2 Fragments topic per D2: outline in the map (multi-passage source pointers recorded), README passages consolidated, vacating sites get pointers; draft authored and pushed
- [ ] 3.3 Apply the remaining approved sweep verdicts (each as README + topic + map edits); give each confirmed lookup surface its See also block from the sweep's site inventory (D2b), recorded in the map's cross-link registry

## 4. Publish & verify

- [ ] 4.1 Standing draft review; publish topic + listing changes together
- [ ] 4.2 Verify: new headings in TOC/nav, pointers resolve, no dead anchors (crawl the cross-link set); parity checks green (`core-readme-accuracy` examples, coverage map)
