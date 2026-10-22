# Spec Delta

## MODIFIED Requirements

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
- **THEN** it contains the side-nav collapsible, code-panel tab-strip and `--p-code-token-*` theme rules in the `pink.components` layer
- **AND** the package exposes no `./styles/*` subpath

#### Scenario: no Appwrite packages in the dependency graph

- **WHEN** the workspace is installed
- **THEN** no workspace manifest lists `@appwrite.io/pink` or `@appwrite.io/pink-icons`
- **AND** neither appears in `pnpm-lock.yaml`

## ADDED Requirements

### Requirement: Pink's cascade lives under one top-level layer

Every rule in `dist/pink.css` SHALL sit inside a single top-level cascade layer named `pink`, with pink's own layers (`css-variables`, `resets`, `icons`, `animations`, `elements`, `components`, `grids`, `utilities`) nested inside it in that order. The stylesheet SHALL NOT place rules in any other top-level layer, and SHALL leave no rule unlayered.

#### Scenario: inner layers keep their order under pink

- **WHEN** `dist/pink.css` is compiled
- **THEN** every style rule is inside `@layer pink`
- **AND** the nested layers resolve as `pink.css-variables` through `pink.utilities`, in the order above

#### Scenario: unlayered consumer CSS still wins

- **WHEN** a consumer's unlayered stylesheet sets a property on an element pink also styles
- **THEN** the consumer's declaration applies regardless of specificity, as it did before the change
