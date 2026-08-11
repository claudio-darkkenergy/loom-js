## 0. Prerequisites

- [ ] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; measure `dist/index.mjs` min+gzip (expected ≈ 9,944 B post-`add-spread-props`) and set **per-addition byte budgets** (`el`, `RouteLink`, `Svg`, `Picture`) in design Decision 5.
- [ ] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in files this change touches (`src/index.ts`, router/routing surface).
- [ ] 0.3 Verify `route()`/`onRoute` behavior for modifier-clicks and non-left-clicks (design Decision 3's "no second policy layer" premise); file a router finding if a gap shows.

## 1. el(tagName) — specs first, then green

- [ ] 1.1 Unit specs: renders named tag with `attrs`/`on`/`className`/`children`; memoized (same reference per tag); DOM reuse across re-renders; void tags childless; works as `is=`-style value and composed via element syntax.
- [ ] 1.2 Implement `src/elements/el.ts` per design Decision 2 (per-tag chunks array, `Map` memo, void-tag check); export from `index.ts`.
- [ ] 1.3 Suite + type-checks green; measure against the 0.1 budget.

## 2. RouteLink — specs first, then green

- [ ] 2.1 Unit specs: internal href routes via router without page load; `target="_blank"` and external-origin hrefs fall through; children/slots render; no active-state class/attribute.
- [ ] 2.2 Implement `src/elements/route-link.ts` per design Decision 3; export from `index.ts`.
- [ ] 2.3 Suite + type-checks green; measure against budget.

## 3. Media — specs first, then green

- [ ] 3.1 Unit specs: `Svg` sprite composition (`path#svgId`, `size` over `height`/`width`, `fill="currentColor"`); `Picture` with sources → `<picture>` + `<source>`s + `<img>`; without sources → bare `<img>`; `SourceProps` exported as type.
- [ ] 3.2 Implement `src/elements/media.ts` per design Decision 4 (chooser over two internal template components); export from `index.ts`.
- [ ] 3.3 Suite + type-checks green; measure against budget; record the four-addition sum.

## 4. Verification & docs

- [ ] 4.1 Full `test-ci`, `type-check`, `type-check-tests` green; tree-shake sanity check (a bundle importing none of the new exports carries none of their bytes).
- [ ] 4.2 Prettier `--check` clean on changed files.
- [ ] 4.3 `packages/core/README.md`: "Element components" section (RouteLink, Svg, Picture, el) positioned per the element-syntax-first docs direction.
- [ ] 4.4 Changeset for `@loom-js/core` — minor (additive).
- [ ] 4.5 Update `.claude/skills/skill-config.md` if its component-model notes should mention the core element components.
