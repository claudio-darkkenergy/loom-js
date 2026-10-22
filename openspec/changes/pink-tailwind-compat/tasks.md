# Tasks

## 1. Swap `classnames` for `clsx` in pink

- [x] 1.1 Check `SOLID-AUDIT-REPORT.md` for open violations in the pink modules touched below and resolve any 🔴 first. Verify: no open 🔴 entry names a file in `packages/pink/src` or `packages/pink/scss/_index.scss`
- [x] 1.2 In `packages/pink/package.json`, replace `classnames` with `clsx` and run `pnpm install`. Verify: `pnpm why classnames` lists only `@loom-js/loom` (and the excluded `apps/docs` manifest), and `pnpm-lock.yaml` resolves `clsx` under `packages/pink`
- [x] 1.3 Add the internal helper `packages/pink/src/utils/cn.ts` (re-exports `clsx` as `cn`, not in the public index), point every `import classNames from 'classnames'` in `packages/pink/src/**` at it with call sites renamed to `cn` and their arguments unchanged (`pink-modal` included), and swap `classnames` for `clsx` in `rollup.config.ts` externals. Verify: `grep -rn "classnames\|from 'clsx'" packages/pink/src` finds only the helper; `dist/` imports `clsx` rather than bundling it; `pnpm -F @loom-js/pink type-check` and `build-package` pass; `pnpm -F @loom-js/pink build` (Storybook) builds
- [x] 1.4 Update `.claude/skills/skill-config.md` for the dependency change. Verify: it names `clsx` wherever it named `classnames` for pink
- [x] 1.5 Fix the editor type errors in `rollup.config.ts` and `.storybook/preview.ts`. They predate this change: the root NodeNext catch-all config was checking them, so the CJS-typed rollup plugins typed as namespaces and the CSS side-effect imports had no types. Make `tsconfig.json` a solution file over `tsconfig.lib.json` (src, the rollup plugin's config) and `tsconfig.node.json` (tooling: Bundler resolution, `vite/client` types), with `type-check` running both. Verify: both projects report 0 errors; an injected error in each is caught; `build-package` and Storybook build; no `*.tsbuildinfo` left behind

## 2. Nest pink's cascade under one layer

- [x] 2.1 Before editing, capture computed styles for a fixed element set (a `PinkButton`, `PinkTag`, side-nav item, code panel and a `u-*` utility) on `/` and one docs topic of an `apps/loom` production build. Verify: the baseline JSON is saved in the scratchpad
- [x] 2.2 Rewrite `packages/pink/scss/_index.scss`: the `@layer theme, base, pink, components, utilities;` order statement first, then every existing layer nested in `@layer pink { … }`. Verify: after `build-css`, a node check over `dist/pink.css` finds the order statement as the first rule, exactly one other top-level rule (`@layer pink{…}`), and the inner layer list in the original order
- [x] 2.3 Rebuild `apps/loom` and re-capture the 2.1 element set. Verify: computed styles are identical to the baseline; Storybook stories render unchanged
- [x] 2.4 Update `docs/topics/17-pink.md` (the layer-order paragraph now reads `pink.css-variables` … `pink.utilities` under one `pink` layer) and `docs/topics/21-pink-layout.md` (the "utilities layer sits last" line is scoped to pink's own cascade). Verify: `pnpm format:check` passes; the wording matches `dist/pink.css`
- [x] 2.5 Add `.changeset/pink-tailwind-compat.md` (`@loom-js/pink`: minor) covering the `clsx` swap, the `pink` layer and the breaking surface (consumer CSS that wrote into pink's inner layer names). Verify: `pnpm status-packages` lists pink as minor

## 3. Example app: `apps/examples/pink-tailwind`

- [x] 3.1 Scaffold the private workspace `@loom-js/example-pink-tailwind`: `package.json` (deps `@loom-js/core`, `@loom-js/pink`; devDeps `@loom-js/build`, `@loom-js/typescript-config`, `tailwindcss`, `@tailwindcss/cli`, `puppeteer`), `loom.config.ts`, `tsconfig.json` extending the shared `app.json`, `.gitignore` for `.generated/`, and its `package.json` added to `.prettierrc` `packageJSONFiles`. Verify: `pnpm install` succeeds and `pnpm -F @loom-js/example-pink-tailwind type-check` passes
- [x] 3.2 Add `src/styles.css` (pink import, `tailwindcss` import, `@source not inline(...)`), the `build` / `dev` scripts (Tailwind CLI then `loom build`, or `tailwindcss --watch` beside `loom dev`), and one page with `PinkButton`, `PinkTag` and `PinkCard` restyled with Tailwind utilities, plus one `--p-*` token used through an arbitrary value. Verify: `pnpm -F @loom-js/example-pink-tailwind build` emits `build/`; served, the page renders the overrides with a clean console (checked in Chrome)
- [x] 3.3 Confirm the collision list: run the Tailwind CLI with `@source inline(...)` over every class selector in `packages/pink/scss` and diff the generated utility selectors against pink's. Verify: the result is exactly `container`, `list-item`, `table` and `table-row` (first run found four, not the two the design assumed; spec, design and proposal updated). If it changes again, update the `pink-tailwind-compatibility` spec, the `@source not inline` line and the docs before going on
- [x] 3.4 Add `test-ci` (`node --test`): build, serve `build/`, and assert in puppeteer that a `bg-red-500` `PinkButton` computes Tailwind's red, an unclassed `PinkButton` keeps non-zero padding and pink's background, and a `PinkTag`'s class list holds `mt-4`, `uppercase`, `tag` and `is-success`. Verify: the suite passes; temporarily reverting 2.2 makes the preflight and override assertions fail
- [x] 3.5 Write the example's `README.md`: the import order, why it matters (one sentence on the layer order), the collision exclusion, and the two-watcher dev note. Verify: following it from a clean clone reproduces 3.2

## 4. Docs: Tailwind section

- [x] 4.1 Add a Tailwind section to `docs/topics/17-pink.md`: import pink before `tailwindcss`, utilities override pink, the `container` / `list-item` / `table` / `table-row` collisions with their `@source not inline` fix, and a pointer to the example. Update `docs/pink-content-map.md` source pointers for the new section. Verify: `pnpm format:check` passes; the snippet matches the example's `src/styles.css` verbatim
- [x] 4.2 Push the updated pink topics to Contentful and publish them. Verify: the published entries' content matches the topic files, and the docs page renders the new section after a rebuild
- [x] 4.3 Add `apps/examples/*` to the CLAUDE.md "Repo shape" apps line (private examples, pink + Tailwind among them). Verify: the line names the new workspace

## 5. Integration

- [x] 5.1 From the repo root, run `pnpm build`, `pnpm format:check` and `type-check` for pink, loom, sandbox and the example, plus `pnpm -F @loom-js/example-pink-tailwind test-ci`. Verify: all pass; `pnpm build` builds the example after pink's `build-package`
