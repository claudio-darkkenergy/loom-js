## Context

`@loom-js/pink` (0.6.x) is ~30 loom components that emit Pink Design class names. The CSS behind those classes and the `icon-*` font come from `@appwrite.io/pink@1.0.0` and `@appwrite.io/pink-icons@1.0.0`, imported for side effects by each consumer (`apps/loom/src/app/bootstrap.ts`, pink's Storybook preview).

Verified state of upstream (2026-10-03):

- github.com/appwrite/pink is **archived**; head `bfc9ba1`; `packages/ui/package.json` is version 1.0.0 — the same version npm serves, so the repo head and the installed tarball are the same source.
- Repo `LICENSE` is **MIT, © 2023 Appwrite** (the package manifests say ISC; the repo license governs the source).
- `packages/ui/src`: 103 SCSS files, cascade layers (`css-variables, resets, icons, animations, elements, components, grids, utilities`), built with `sass --style=compressed`. The resets layer loads `normalize.css` and `the-new-css-reset` from node_modules at compile time.
- `packages/icons`: 358 SVGs, a `svgtofont` build script, and a built `dist/` (`icon.css` + eot/ttf/woff/woff2).

Constraints: no deprecation aliases (clean breaks); pink stays 0.x, breaking = minor changeset; `dist/` is turbo output and wiped; prettier `format:check` runs in CI over the whole tree; `turbo` `dev`/`storybook`/`build` already depend on `^build-package`.

## Goals / Non-Goals

**Goals:**

- Pink has no `@appwrite.io/*` dependency and consumers import styles only from `@loom-js/pink`.
- The SCSS and SVG sources live in `packages/pink` and are the thing we edit from now on.
- Adoption is provably a no-op visually: compiled CSS equivalent to upstream 1.0.0.
- Upstream license terms are met.
- Settle the package name now.

**Non-Goals:**

- Renaming the `Pink*` exports (possible follow-up before 1.0).
- Pruning unused upstream components/grids, dropping `.eot`, restyling, new tokens.
- Wiring icon-font regeneration into the build (only needed when an icon is added or changed).
- Stylelint; a pink test suite.

## Decisions

### D1 — Package name stays `@loom-js/pink` (recommended, needs confirmation)

A second design system is planned under a brand name (`fabric` is reserved for it). With two systems in the scope, each needs a brand name; a generic `@loom-js/ui` would label the Pink-derived one as _the_ loom UI library and make the second one's position awkward. `pink` also matches the `Pink*` exports that are staying, and says truthfully what the package is: Pink Design 1.0, continued.

- _`@loom-js/ui`_ — fits the descriptive naming of `core`/`build`/`highlight` and frees 1.0.0, but only makes sense if this were the single UI package. Rejected on the two-systems fact.
- _A new brand name_ — buys distance from Appwrite's live internal "Pink" brand and a clean version line, at the cost of history and a package/export-prefix mismatch (or a forced `Pink*` rename). Not worth it: the package is scoped, MIT-licensed source, and attributed.
- Cost of keeping: npm's burned `1.0.0` — the first stable release is `1.0.1` or `2.0.0`. Cosmetic.

If the maintainer picks a rename instead, the delta is mechanical: directory + manifest name, every `@loom-js/pink` import (apps, specs, docs, `.prettierrc` `packageJSONFiles`), a first publish under the new name, and `npm deprecate @loom-js/pink`. Tasks group 7 covers it and is skipped otherwise.

### D2 — One-time copy, not a fork or subtree

Upstream is archived: there is nothing to merge from again, so a GitHub fork, submodule or subtree would carry sync machinery with no source to sync. Copy the files, record `appwrite/pink@bfc9ba1` in `NOTICE`, done. Source is taken from the git archive (it carries `LICENSE` and the icon build scripts); the installed npm tarball is the cross-check.

### D3 — Layout inside `packages/pink`

```
packages/pink/
  scss/            ← upstream packages/ui/src (entry: _index.scss)
  icons/
    svg/           ← upstream packages/icons/svg (source)
    font/          ← upstream packages/icons/dist (icon.css + eot/ttf/woff/woff2, committed; no SVG font)
    build.js …     ← upstream generator scripts, carried but not wired
  src/             ← loom components (unchanged)
  NOTICE           ← upstream MIT text, provenance, reset-library notices
```

Icons stay in the same package rather than a second `@loom-js/pink-icons`: the components reference `icon-*` classes directly, and one package means one install and one version. The built font is committed under `icons/font/` (not `dist/`, which is wiped) because regenerating it needs `svgtofont` + `oslllo-svg-fixer`, a heavy toolchain with no use until an icon changes.

### D4 — SCSS stays the source; `sass` compiles in `build-package`

`build-package` becomes `sass --style=compressed --load-path=node_modules scss/_index.scss:dist/pink.css && rollup …`. `sass`, `normalize.css` and `the-new-css-reset` are devDependencies — the resets are inlined into the output, so they are not runtime deps.

- _Convert to plain CSS once and drop Sass_ — loses the mixins/functions/breakpoint variables the source is written in; we would be maintaining compiler output.
- _Commit compiled CSS_ — two sources of truth.

Storybook imports `../scss/_index.scss` directly (vite compiles SCSS when `sass` is present), so style edits hot-reload; if vite cannot resolve the reset packages from `meta.load-css`, set `css.preprocessorOptions.scss.loadPaths` in `viteFinal`.

### D5 — Exports and consumer imports

```
"./pink.css":  "./dist/pink.css"
"./icons.css": "./icons/font/icon.css"
```

Consumers: `import '@loom-js/pink/pink.css'; import '@loom-js/pink/icons.css';`. Two entries mirror today's two imports (an app that brings its own icons can skip the font). The three loom-owned sheets under `src/styles/` (`side-nav`, `code-panel-tabs`, `code-tokens`) fold into the SCSS as `components`-layer partials and the `./styles/*` export goes (maintainer, 2026-10-04) — they patch pink's own components, so one stylesheet is the honest shape. They were unlayered before and therefore outranked every layer; nothing in `grids`/`utilities` targets the same selectors, so the demotion changes no computed style. `icon.css` references its font files by relative URL, which esbuild's existing `file` loaders (`.eot/.ttf/.woff/.woff2/.svg` in `@loom-js/build`) already handle — same as today. `apps/loom` relies on `declare module '*.css'`, so the two `@appwrite.io/*` ambient declarations go away.

### D6 — Adopt verbatim, then format, then own

Three commits so blame and parity stay legible:

1. Verbatim copy of upstream files (+ `NOTICE`).
2. `prettier --write` over the new trees — hash added to `.git-blame-ignore-revs`.
3. Build wiring, exports, consumer switch, dependency removal.

Parity gate (one-time, before step 3 removes the dependency): compile `scss/` and compare against `node_modules/@appwrite.io/pink/dist/pink.css` after normalising both through the same minifier. Any difference must be attributable to the Sass compiler version and is listed in the change notes; an unexplained rule difference blocks the change. `icons/font/*` must be byte-identical to the installed `pink-icons/dist`.

### D7 — Licensing

Package license stays ISC for our code. `NOTICE` carries the upstream MIT text and copyright (required to accompany copies), the provenance line, and the MIT notices for `normalize.css` and `the-new-css-reset` since compressed output strips their header comments. `NOTICE` ships in the published package.

## Risks / Trade-offs

- [Newer Sass emits different but equivalent CSS, so byte comparison fails] → compare normalised output; record compiler-only differences.
- [Sass deprecation warnings on 2023-era SCSS] → fix only what errors; warnings are follow-up material, noted in tasks.
- [Vite/Storybook fails to resolve package paths in `meta.load-css`] → `loadPaths` fallback in D4; worst case Storybook imports `dist/pink.css`.
- [External consumers break on upgrade] → intended clean break; the changeset states the two-line import swap.
- [We now own ~470 KB of SCSS, much of it unused by our components] → accepted for parity; pruning is its own change with its own visual review.
- [`Pink` remains Appwrite's active internal brand] → scoped name, MIT source, explicit attribution; revisit only if they object.

## Migration Plan

Lands as a normal edge → main change; the next Version Packages PR publishes pink 0.7.0. Rollback is a revert — the `@appwrite.io` packages remain on npm. Consumer migration: replace the two `@appwrite.io` imports with the two `@loom-js/pink` ones and drop the `@appwrite.io/*` dependencies.

## Open Questions

- **Name** — resolved 2026-10-04: `@loom-js/pink` stays; the maintainer keeps the option to rename before the first 1.x release.

## Parity results (2026-10-04)

Compared as sets of `(context > selector :: declaration)` pairs after both sheets go through esbuild's CSS minifier: **4261 pairs each, 0 missing either way**. The ordered diff shows only these, all from Sass 1.71 (upstream's lockfile) → 1.105:

- Mixed declarations after nested rules are now emitted in place as a second rule with the same selector instead of hoisted (`.modal-content`, `.table-with-scroll`, `.drop-section`, `.upload-box-content`, `.side-nav-main`, form `.is-resizable`). Same selector, same declarations; no cascade change.
- `-#{0}rem` prints as `-0rem` (was `0rem`) in the `u-margin-*-negative-0` utilities.
- Colors keep their authored `hsla()` form instead of being folded to `rgba()` (three `::backdrop` rules); hex case and quote style in two gradients / three font-family variables.
- Whitespace inside custom-property values follows the (prettier-formatted) source.

`the-new-css-reset` is pinned to `1.11.2` (upstream's lock); `1.11.3` adds `ol { counter-reset: revert }`, which is a real rule change and belongs to a follow-up with its own visual check. `normalize.css` resolves to the same `8.0.1`. Icon font files: byte-identical to the published `@appwrite.io/pink-icons@1.0.0` dist. The prod `apps/loom` bundle (`static/js/spa.css`) contains every pair of the compiled `pink.css` and `icon.css`.

Two trims on top of the verbatim adoption (maintainer, 2026-10-04): the SVG-font fallback (`icon.svg`, `icon.symbol.svg`, 2.1 MB, iOS ≤4.1 only) is dropped from `icons/font/`, `icon.css`/`icon.scss` and the generator templates — `eot` stays for now; and `package.json` gains a `files` allowlist so local `storybook-static/`, `debug-storybook.log`, `project/` and the icon sources/generator never pack. A future font regeneration (`icons/build.js`) still emits the two SVG files; delete them after regenerating or wire `svgtofont`'s output options when that follow-up lands.
