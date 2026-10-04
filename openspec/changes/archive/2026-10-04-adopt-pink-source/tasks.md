## 0. Gate

- [x] 0.1 Maintainer confirms the package name (design D1: keep `@loom-js/pink`). A rename activates group 7; otherwise group 7 is struck.
- [x] 0.2 Check `SOLID-AUDIT-REPORT.md` for open 🔴 entries on files this change edits (`apps/loom/src/app/bootstrap.ts`, pink `rollup.config.ts`, `.storybook/preview.ts`); resolve any before editing.

## 1. Verbatim copy (commit 1)

- [x] 1.1 Fetch appwrite/pink at `bfc9ba1`; copy `packages/ui/src/**` → `packages/pink/scss/`.
- [x] 1.2 Copy `packages/icons/svg/**` → `packages/pink/icons/svg/`, `packages/icons/dist/**` → `packages/pink/icons/font/`, and the generator scripts (`build.js`, `optimize.js`, `scripts.js`) → `packages/pink/icons/`.
- [x] 1.3 Confirm the copied `scss/` matches the installed `@appwrite.io/pink@1.0.0/src` and `icons/font/` is byte-identical to the installed `@appwrite.io/pink-icons@1.0.0/dist` (`diff -r`).
- [x] 1.4 Add `packages/pink/NOTICE`: upstream MIT text + © 2023 Appwrite, source repo + commit + version, and the `normalize.css` / `the-new-css-reset` MIT notices.
- [x] 1.5 Commit the copy unmodified (staged by explicit path).

## 2. Format (commit 2)

- [x] 2.1 `prettier --write` the new `scss/` and `icons/` script files; confirm `pnpm format:check` passes (exclude generated `icons/font/*` and `icons/svg/*` in `.prettierignore` if prettier touches them).
- [x] 2.2 Commit; add the hash to `.git-blame-ignore-revs`.

## 3. Build the stylesheet

- [x] 3.1 Add devDependencies to pink: `sass`, `normalize.css`, `the-new-css-reset` (versions matching upstream's ranges).
- [x] 3.2 `build-package`: compile `scss/_index.scss` → `dist/pink.css` (compressed, node_modules load path) before the rollup step; confirm rollup's cleanup does not delete it.
- [x] 3.3 Parity gate: normalise the compiled `dist/pink.css` and upstream's `dist/pink.css` through one minifier and diff. Record compiler-only differences in the change notes; stop on any rule difference.
- [x] 3.4 Note Sass deprecation warnings (do not fix unless they error).

## 4. Package surface

- [x] 4.1 `exports`: add `"./pink.css": "./dist/pink.css"` and `"./icons.css": "./icons/font/icon.css"`.
- [x] 4.2 Remove `@appwrite.io/pink` and `@appwrite.io/pink-icons` from pink's `dependencies`; update `description` and `keywords` to say the package continues Pink Design 1.0.
- [x] 4.3 `npm pack --dry-run` in `packages/pink`: tarball contains `dist/pink.css`, `icons/font/*`, `scss/**`, `NOTICE`.

## 5. Switch consumers

- [x] 5.1 `packages/pink/.storybook/preview.ts`: import `../scss/_index.scss` and `../icons/font/icon.css`; add the `loadPaths` fallback in `main.ts` `viteFinal` only if the reset packages fail to resolve.
- [x] 5.2 `apps/loom/src/app/bootstrap.ts`: import `@loom-js/pink/pink.css` and `@loom-js/pink/icons.css`; delete the two `@appwrite.io/*` ambient declarations in `declarations.d.ts`; drop both deps from `apps/loom/package.json`.
- [x] 5.3 `apps/sandbox/src/bootstrap.ts`: update the commented-out imports to the new paths.
- [x] 5.4 `pnpm install`; confirm no `@appwrite.io` entry remains in any manifest or `pnpm-lock.yaml`.

## 6. Verify, document, release

- [x] 6.1 `pnpm -F @loom-js/pink -F @loom-js/loom -F @loom-js/sandbox type-check` and `pnpm build-packages`.
- [x] 6.2 Storybook: spot-check elements, components, layout and an `icon-*` story in both themes against the pre-change build.
- [x] 6.3 Isolated prod build of `apps/loom` (`--outDir`): prerender passes; compare the emitted CSS and font assets with a pre-change build; check `/`, a docs topic and `/benchmarks` in the browser.
- [x] 6.4 Update `CLAUDE.md` (pink entry, any `@appwrite.io` mention) and `.claude/skills/skill-config.md` (design-system row, dependencies).
- [x] 6.5 Changeset: `@loom-js/pink` minor — breaking: the two-line import swap and the removed dependencies.
- [x] 6.6 `pnpm format:check`; pause for diff review before the build-wiring commit (commit 3).

## 8. Trims (maintainer, 2026-10-04)

- [x] 8.1 Drop the SVG-font fallback: delete `icons/font/icon.svg` + `icon.symbol.svg`, remove the `format('svg')` source from `icon.css`, `icon.scss` and both generator templates; update `NOTICE`.
- [x] 8.2 Add the `files` allowlist (`dist`, `icons/font`, `scss`, `src`, `NOTICE`); `npm pack --dry-run` shows no local artefacts, icon sources or generator.
- [x] 8.3 Re-verify: prod build emits no `icon-*.svg`, bundle still carries every icon rule, `format:check` passes.

## 9. Fold the loom-owned sheets into pink.css (maintainer, 2026-10-04)

- [x] 9.1 Move `src/styles/side-nav.css` → end of `scss/7-components/_side-nav.scss`, `code-panel-tabs.css` → end of `_code-panel.scss`, `code-tokens.css` → new `_code-tokens.scss` forwarded from the components index; delete `src/styles/`.
- [x] 9.2 Remove the `./styles/*` export; drop the three imports from `apps/loom` bootstrap and Storybook preview; update `skill-config.md` pointers and the changeset.
- [x] 9.3 Parity: compiled `pink.css` ≡ upstream ∪ the three old sheets (decls check, layer context ignored for the moved rules); prod build + bundle check + Storybook build + `format:check` + `openspec validate`.

## 7. Rename (only if 0.1 picks a new name)

- [x] 7.1 ~~Rename the manifest `name`, repository `directory`, and `packages/pink` directory; update `.prettierrc` `packageJSONFiles`, `turbo`/workspace references, and every `@loom-js/pink` import in apps, stories, specs and docs.~~ — struck: name kept (0.1)
- [x] 7.2 ~~Changeset for the new package name (first publish); after it is live, `npm deprecate @loom-js/pink` with a pointer to the new name.~~ — struck: name kept (0.1)
- [x] 7.3 ~~Update the pre-1.0 versioning note in pink's CHANGELOG context (the burned `1.0.0` no longer applies).~~ — struck: name kept (0.1)
