## 0. Prerequisites

- [x] 0.1 Baseline: `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green; measure `dist/index.mjs` min+gzip (expected ≈ 9,944 B post-`add-spread-props`) and set **per-addition byte budgets** (`el`, `RouteLink`, `Svg`, `Picture`) in design Decision 5. → All green; baseline exactly 9,944 B; budgets el 256 / RouteLink 256 / Svg 224 / Picture 352 (sum 1,088; ceiling 11,032 B).
- [x] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in files this change touches (`src/index.ts`, router/routing surface). → Only 🔴 is `services/api/log.ts` (untouched); `router.ts` 🟡 binds only if edited — this change doesn't edit it.
- [x] 0.3 Verify `route()`/`onRoute` behavior for modifier-clicks and non-left-clicks (design Decision 3's "no second policy layer" premise); file a router finding if a gap shows. → `route()` excepts ctrl/meta (native new-tab preserved); middle-click never fires `click`. **Filed finding:** shift-click (new-window intent) is not excepted — router-level gap, recorded in design, not patched in RouteLink. Confirmed `pushState` throws cross-origin, so RouteLink's same-origin/`_blank` eligibility check is required as designed.

## 1. el(tagName) — specs first, then green

- [x] 1.1 Unit specs: renders named tag with `attrs`/`on`/`className`/`children`; memoized (same reference per tag); DOM reuse across re-renders; void tags childless; works as `is=`-style value and composed via element syntax. → `tests/unit/elements/el.spec.ts` (5 specs); red confirmed (missing export).
- [x] 1.2 Implement `src/elements/el.ts` per design Decision 2 (per-tag chunks array, `Map` memo, void-tag check); export from `index.ts`. → reuses the compiler's `VOID_TAG`; `src/elements/index.ts` + root re-export.
- [x] 1.3 Suite + type-checks green; measure against the 0.1 budget. → 147 passed; **132 B of 256 B** (bundle 10,076 B).

## 2. RouteLink — specs first, then green

- [x] 2.1 Unit specs: internal href routes via router without page load; `target="_blank"` and external-origin hrefs fall through; children/slots render; no active-state class/attribute. → `route-link.spec.ts` (4 specs, with a click-through guard so the test iframe never navigates); red confirmed.
- [x] 2.2 Implement `src/elements/route-link.ts` per design Decision 3; export from `index.ts`.
- [x] 2.3 Suite + type-checks green; measure against budget. → 151 passed; **134 B of 256 B** (bundle 10,210 B).

## 3. Media — specs first, then green

- [x] 3.1 Unit specs: `Svg` sprite composition (`path#svgId`, `size` over `height`/`width`, `fill="currentColor"`); `Picture` with sources → `<picture>` + `<source>`s + `<img>`; without sources → bare `<img>`; `SourceProps` exported as type. → `media.spec.ts` (5 specs, incl. empty-sources edge); red confirmed.
- [x] 3.2 Implement `src/elements/media.ts` per design Decision 4 (chooser over two internal template components); export from `index.ts`.
- [x] 3.3 Suite + type-checks green; measure against budget; record the four-addition sum. → 156 passed; **Svg 150 B of 224** (Svg-only build 10,360 B), **Picture 214 B of 352**; four-addition sum **630 B of 1,088 B** — bundle 10,574 B vs 11,032 B ceiling.

## 4. Verification & docs

- [x] 4.1 Full `test-ci`, `type-check`, `type-check-tests` green; tree-shake sanity check (a bundle importing none of the new exports carries none of their bytes). → 156 passed; **tree-shaking initially FAILED** — fixed with `/* @__PURE__ */` annotations + two build-pipeline changes (tsconfig `removeComments` dropped, terser `preserve_annotations`); verified min-import bundle sheds all four components (design Findings).
- [x] 4.2 Prettier `--check` clean on changed files.
- [x] 4.3 `packages/core/README.md`: "Element components" section (RouteLink, Svg, Picture, el) positioned per the element-syntax-first docs direction.
- [x] 4.4 Changeset for `@loom-js/core` — minor (additive). → `.changeset/core-element-components.md` (also records the tree-shaking fix).
- [x] 4.5 Update `.claude/skills/skill-config.md` if its component-model notes should mention the core element components. → element-components bullet + the PURE-annotation build convention added.
