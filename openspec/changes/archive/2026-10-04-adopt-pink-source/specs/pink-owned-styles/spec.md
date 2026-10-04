## ADDED Requirements

### Requirement: Pink ships its own stylesheet and icon font

`@loom-js/pink` SHALL build its stylesheet from SCSS source kept in the package and SHALL export it, together with the icon font stylesheet, under its own package name. The package SHALL NOT depend on `@appwrite.io/pink` or `@appwrite.io/pink-icons`.

#### Scenario: build-package emits the stylesheet

- **WHEN** `pnpm -F @loom-js/pink build-package` runs
- **THEN** `dist/pink.css` is compiled from `packages/pink/scss/_index.scss`
- **AND** the JS and type bundles are emitted as before

#### Scenario: stylesheet exports resolve

- **WHEN** a consumer imports `@loom-js/pink/pink.css` and `@loom-js/pink/icons.css`
- **THEN** both resolve to files inside the package
- **AND** the icon stylesheet's font URLs resolve to font files shipped beside it

#### Scenario: loom's component patches are part of the stylesheet

- **WHEN** `dist/pink.css` is compiled
- **THEN** it contains the side-nav collapsible, code-panel tab-strip and `--p-code-token-*` theme rules in the `components` layer
- **AND** the package exposes no `./styles/*` subpath

#### Scenario: no Appwrite packages in the dependency graph

- **WHEN** the workspace is installed
- **THEN** no workspace manifest lists `@appwrite.io/pink` or `@appwrite.io/pink-icons`
- **AND** neither appears in `pnpm-lock.yaml`

### Requirement: Workspace consumers load styles from pink only

`apps/loom`, `apps/sandbox` and pink's Storybook SHALL load the design-system stylesheet and icon font through `@loom-js/pink` (or, for Storybook, the package's own source) and SHALL NOT import any `@appwrite.io/*` module.

#### Scenario: docs app boots with pink's stylesheet

- **WHEN** `apps/loom/src/app/bootstrap.ts` is bundled
- **THEN** it imports `@loom-js/pink/pink.css` and `@loom-js/pink/icons.css`
- **AND** the built app renders components and `icon-*` glyphs with the same styling as before the change

#### Scenario: Storybook renders from source

- **WHEN** `pnpm -F @loom-js/pink storybook` runs
- **THEN** stories render styled and with icons, with no `@appwrite.io/*` import in `.storybook/`

### Requirement: Adoption preserves upstream 1.0.0 output

The first stylesheet built from the adopted source SHALL be equivalent to `@appwrite.io/pink@1.0.0`'s `dist/pink.css`, and every adopted icon font file SHALL be byte-identical to its counterpart in `@appwrite.io/pink-icons@1.0.0`'s `dist/`. The SVG-font fallback (`icon.svg`, `icon.symbol.svg` and the `format('svg')` source) is not adopted. Differences attributable only to the Sass compiler version are permitted and SHALL be recorded.

#### Scenario: compiled CSS matches upstream

- **WHEN** the adopted SCSS is compiled and both it and upstream's `dist/pink.css` are normalised through the same minifier
- **THEN** the two outputs contain the same rules in the same order
- **AND** any remaining difference is listed in the change notes with its compiler-level cause

#### Scenario: icon font matches upstream

- **WHEN** `packages/pink/icons/font/` is compared with the installed `@appwrite.io/pink-icons/dist/`
- **THEN** `icon.eot`, `icon.ttf`, `icon.woff`, `icon.woff2` and `info.json` are byte-identical
- **AND** `icon.css` differs only by the removed `format('svg')` source, and no `.svg` font file ships

### Requirement: The published tarball is an allowlist

`packages/pink/package.json` SHALL declare `files` so the tarball carries only `dist/`, `icons/font/`, `scss/`, `src/`, `NOTICE` and the manifest-adjacent files npm always includes.

#### Scenario: local artefacts stay out of the tarball

- **WHEN** `npm pack --dry-run` runs in `packages/pink` with a local `storybook-static/`, `debug-storybook.log` or `project/` present
- **THEN** none of them, nor `icons/svg/`, `icons/templates/` or the icon build scripts, appear in the tarball

### Requirement: Upstream origin is attributed

The package SHALL ship a `NOTICE` file carrying the upstream MIT license text and copyright (Appwrite, 2023), the source repository and commit the code was taken from, and the license notices of the reset libraries inlined into the compiled stylesheet.

#### Scenario: notice ships with the package

- **WHEN** the package is packed for publishing
- **THEN** the tarball contains `NOTICE` with the Appwrite MIT notice, the `appwrite/pink` commit reference, and the `normalize.css` and `the-new-css-reset` notices
