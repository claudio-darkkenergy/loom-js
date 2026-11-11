# Tasks

## 1. Version reader and define

- [x] 1.1 Add `apps/loom/project/client/core-version.mts`: read `node_modules/@loom-js/core/package.json` relative to the app, return its `version`, and throw with the manifest path when the file is missing or `version` isn't semver. Add `project/client/tests/core-version.test.mjs` covering: matches `packages/core/package.json`'s version, throws on a missing file, throws on a non-semver version (fixture dir in the test). Verify with `pnpm -F @loom-js/loom test-ci`.
- [x] 1.2 In `apps/loom/loom.config.ts`, add `__CORE_VERSION__` to `define` from the reader, and declare `declare let __CORE_VERSION__: string;` in `src/app/types/declarations.d.ts`. Verify with `pnpm -F @loom-js/loom type-check`.

## 2. Header badge and version

- [x] 2.1 Add `src/app/components/branding/release-status/` (`ReleaseStatus.ts` + `index.ts`): `PinkTag isEyebrowHeading` reading "Beta", then an external link to `https://www.npmjs.com/package/@loom-js/core` (`target="_blank"`, `rel="noopener"`) reading `v${__CORE_VERSION__}`, small and muted. Render it after `BrandLogoLink` in `HeaderBrand` (`src/app/pages/layout.ts`). Verify with `type-check` and in `pnpm -F @loom-js/loom dev` (port 9092): badge + `v0.22.0` at desktop and 375 px viewports, header row not wrapping on either.
- [x] 2.2 In the prerender `validate` hook, throw on any route whose `html` lacks `v<version></a>`, with a `[prerender]` message naming the route; run it beside the footer check, before the per-route early returns. Verify by temporarily expecting a wrong version and confirming the build fails on the first route, then reverting.

- [x] 2.3 On mobile, move the top nav to the header's second row beside search (`'col-1 col-1' / 'col-3 col-2'` in `src/app/pages/styles.module.css`, `grid-header-col-1` on the brand column), replacing the old row-collapse rule. Verify at 375 px: brand on row 1, search + nav on row 2, page `scrollWidth` 375; at 1280 px the header stays one 72 px flex row.

## 3. End-to-end check

- [x] 3.1 Run an isolated production build (`pnpm -F @loom-js/loom build -- --outDir <scratch>` with `.env.local` loaded); confirm it passes `validate`, then grep the emitted `index.html`, one docs topic and `benchmarks/index.html` for `Beta` and `v0.22.0</a>`.
- [x] 3.2 Serve that build, load `/` and one docs topic in Chrome, and confirm after hydration the badge and version show, the version link opens the npm page in a new tab, and the home link's text is still just "loom".
- [x] 3.3 Run `pnpm format:check` and `pnpm -F @loom-js/loom test-ci`; both pass. No changeset: `@loom-js/loom` is private.
