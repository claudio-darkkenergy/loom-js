## 0. Prerequisites

- [x] 0.1 Baselines at apply time: full core/pink/app suites and type-checks green; measure pink dist and app bundle (min+gzip); build the pre-conversion app snapshot for the parity harness. Re-verify the tree (the `fix-docs-toc-duplication` WIP may have landed or moved). → WIP landed + archived (`c427e40`); core 169 green; pink type-check green; **app `type-check` has 8 pre-existing error lines at HEAD** (snapshotted to scratchpad; conversion gate is "no new errors"). Pink dist **3,328 B** min+gzip; app bundle **34,246 B** (all build JS, gzip -9); pre-conversion snapshot saved. Note: pink's `exports.import` is `./src/index.ts`, so the app bundles pink from source — app bundle is the consumer metric.
- [x] 0.2 Audit-rule check (`SOLID-AUDIT-REPORT.md`) for the pink/app files this change touches — resolve or note per severity rules. → No 🔴 in scope. Binding 🟡s: `pink-button` LSP (resolve in 2.1 via the entry's document-the-contract option) and `docs/layout` SRP (resolve in 3.2 via `useDocsLayout()`). Opportunistic 🟢s: `pink/types` `is: Component | any` (2.5 narrows it) and `pink-code-panel-content` line-split extraction (2.3).
- [x] 0.3 Stand up context-count instrumentation (temporary local core patch per design Decision 2) and record the pre-conversion count on the app root page. → Counter in `contextFunction`'s fresh-context branch; **pre-conversion count: 106** contexts on `/` (zero page errors). Patch reverted, pristine builds restored; harness kept in scratchpad for the post-measurement.

## 1. Pilot (design Decision 2)

- [x] 1.1 Convert `PinkBox` (trivial wrapper consumer); DOM parity; stories updated. → template component; parity via the new fixture A/B harness (sorted-attr serializer per the named-slots precedent; whitespace-run/tag-boundary normalization for non-`pre` content). Story compiles unchanged.
- [x] 1.2 Convert `PinkContainer` + its app consumers (`HeroBanner`, `SecondaryContainer`, `PageLayout`'s `is=${Footer}` → `el('footer')`); DOM parity. → **Design amended (Decision 1): pure delegators stay functional** — the template form tripped the array limitation on `HeroBanner`'s children array (caught by the harness as `[object Text]…`). Landed as `SimpleComponent` over `is = el('div')` passing the flat tags shape; `el()` widened to accept flat `id`/`style` (delta spec on `core-element-components`) because tags' `mergeAllowedAttrs` waterfall clobbers `attrs.style` when only flat `className` is set. Pulled the 🟢 `PinkDynamicProps` ISP fix forward (index signature removed, `is: Component`) — ripple fixes in `pink-tag`/`pink-interactive-tag`/story typing; core `PossibleAttrs` index widened to admit `StyleProp` (runtime already supported it). `HeroBanner`'s stray `role` → `attrs.role`. Whole-app `#layout`: **byte-equal, zero page errors**; fixtures all OK; 169 core tests green; 0 new app type errors.
- [x] 1.3 Convert `PinkTopNav` (list-heavy; `items=` stays data-shaped, the `Li`/`Link` loop becomes authored markup/`RouteLink` where sensible); DOM parity. → template component + nested `TopNavItem` template (both component-tag-free, so item arrays take the proven plain-template path); local `PinkTopNavItemProps` replaces the tags `LinkProps` dependence; per-item `onClick` still overrides the nav-level handler; `target` keeps the `_self` default for parity. `RouteLink` adoption deferred to the app conversion (the `items` data API keeps handler-based routing). Fixtures OK; whole-app `#layout` byte-equal.
- [x] 1.4 Record pilot metrics: pink dist, app bundle, context count before/after. If any pattern is falsified, pause and amend design before the sweep. → **Context count 106 → 104** (net −2 from three components: TopNav went 5 wrapper contexts → 3 template contexts; the delegator stayed at zero). Pink dist 3,328 → 3,537 B (+209 B — pink now carries its own templates instead of leaning on tags' shared machinery). App bundle 34,246 → 34,651 B (+405 B gzip, including the core `el()` widening; net payoff arrives when tags' 1,595 B leaves at retirement). **One pattern falsified and amended** (Decision 1 amendment: pure delegators stay functional); everything else held. Sweep may proceed on the amended patterns.

## 2. Pink conversion (leaf → consumer order, parity per component)

- [ ] 2.1 `elements/` leaves: `pink-inline-tag`, `pink-loader`, `pink-status`, `pink-card`, `pink-tag`, `pink-interactive-tag` (`href ? el('a') : el('button')`), `pink-boxes`, `pink-buttons-list`, `pink-tooltip`, `pink-button`.
- [ ] 2.2 `modifiers/`: `with-icon`, `with-tooltip` → `el('span')` (the transformer contract stays props-in/props-out).
- [ ] 2.3 `components/`: `pink-action-bar`, `pink-avatar`, `pink-avatar-group`, `pink-code-panel` (+content/header), `pink-drop-list`, `pink-tabs`, `pink-toggle-button`.
- [ ] 2.4 `layout/`: `pink-grid-box`, `pink-grid-item`, `pink-side-nav`.
- [ ] 2.5 Pink-wide: `is` prop type moves off tags types to core `Component`; storybook builds clean; pink dist re-measured.

## 3. App conversion (16 files, coordinate with any open WIP)

- [ ] 3.1 Components: `BrandLogoLink` (→ `RouteLink`), `ContentCard`, `FocalContainer`, `HeroBanner`, `SecondaryContainer`, `Breadcrumbs`, `SkeletonLoader`, `Toc`, `TopicContent`, `FeatureCard`, `Features`, `ResponsiveImage` (local → core `Picture`), `StyledRichText` (`renderNode` → `el()`), `ContentfulRichText` (local `mergeAllowedAttrs` copy).
- [ ] 3.2 Pages: `docs/layout.ts`, `docs/index.ts` (effect → `el('aside')`), `pages/layout.ts` leftovers (`Svg` import moves to core).
- [ ] 3.3 Whole-app DOM parity on `#layout` plus one content-bearing docs route; app bundle re-measured.

## 4. Tags retirement (design Decision 3)

- [ ] 4.1 Zero-import check (`grep` sweep incl. stories); remove `@loom-js/tags` from pink `peerDependencies` and any remaining manifests.
- [ ] 4.2 Delete `packages/tags`; prune `.prettierrc` `packageJSONFiles` entry and `CLAUDE.md` references; `pnpm install` + full builds green.
- [ ] 4.3 Owner step: `npm deprecate '@loom-js/tags'` with the message pointing to element syntax + core survivors (exact text drafted in the changeset).

## 5. Docs & release

- [ ] 5.1 `packages/core/README.md`: element syntax leads; functional form documented as architecture/escape hatch; tags references gone.
- [ ] 5.2 `.claude/skills/skill-config.md`: authoring convention updated (markup-first, value-position escape hatch, `el()`).
- [ ] 5.3 Changesets: pink **major** (composition-API break, peerDep removal, accumulated per-component notes).
- [ ] 5.4 Full verification: all suites, type-checks, prettier `--check`, storybook build; final metrics summary recorded in design.
- [ ] 5.5 Update `element-syntax-first` umbrella tasks (sections 3–4) and note the umbrella spec-prune for its eventual archive.
