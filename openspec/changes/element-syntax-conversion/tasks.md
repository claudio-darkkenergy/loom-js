## 0. Prerequisites

- [ ] 0.1 Baselines at apply time: full core/pink/app suites and type-checks green; measure pink dist and app bundle (min+gzip); build the pre-conversion app snapshot for the parity harness. Re-verify the tree (the `fix-docs-toc-duplication` WIP may have landed or moved).
- [ ] 0.2 Audit-rule check (`SOLID-AUDIT-REPORT.md`) for the pink/app files this change touches — resolve or note per severity rules.
- [ ] 0.3 Stand up context-count instrumentation (temporary local core patch per design Decision 2) and record the pre-conversion count on the app root page.

## 1. Pilot (design Decision 2)

- [ ] 1.1 Convert `PinkBox` (trivial wrapper consumer); DOM parity; stories updated.
- [ ] 1.2 Convert `PinkContainer` + its app consumers (`HeroBanner`, `SecondaryContainer`, `PageLayout`'s `is=${Footer}` → `el('footer')`); DOM parity.
- [ ] 1.3 Convert `PinkTopNav` (list-heavy; `items=` stays data-shaped, the `Li`/`Link` loop becomes authored markup/`RouteLink` where sensible); DOM parity.
- [ ] 1.4 Record pilot metrics: pink dist, app bundle, context count before/after. If any pattern is falsified, pause and amend design before the sweep.

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
