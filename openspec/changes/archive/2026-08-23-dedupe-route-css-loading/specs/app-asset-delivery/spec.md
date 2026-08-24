# app-asset-delivery Delta

## MODIFIED Requirements

### Requirement: Route HTML loads only its own assets

Each route's generated HTML SHALL reference the shared chunks plus only that route's JS. A route's lazily-imported chunk SHALL NOT appear in another route's HTML. CSS SHALL be referenced through shared stylesheets only (the entry CSS bundle and genuine CSS entry points); per-route CSS chunk files SHALL NOT be referenced by any shell, because their content is already contained in the entry CSS bundle (esbuild does not code-split CSS).

#### Scenario: Home shell excludes docs assets

- **WHEN** the client build completes and `build/index.html` is inspected
- **THEN** it references the shared chunks and the pages entry assets, and no `docs-*.js` or `docs-*.css`

#### Scenario: Docs shell excludes home-page assets

- **WHEN** `build/docs/index.html` is inspected
- **THEN** it references the shared chunks and the docs assets, and no `pages-*.js` or `pages-*.css`

#### Scenario: No shell references route CSS chunk files

- **WHEN** any generated HTML shell (dev or prod) is inspected
- **THEN** its stylesheet links are limited to the entry CSS bundle and CSS entry points, with no `pages-*.css` or `docs-*.css` references

#### Scenario: Hard reload works on both shells

- **WHEN** the user hard-reloads `/` and `/docs/get-started` (dev server and production rewrites)
- **THEN** each page boots and renders its route without console module-load errors

## ADDED Requirements

### Requirement: Each CSS rule is delivered exactly once

Across all stylesheets referenced by a route's HTML shell, any given CSS rule SHALL reach the browser exactly once. No rule may be applied twice because two linked stylesheets contain the same content.

#### Scenario: Route-level rules apply once in devtools

- **WHEN** the docs page is loaded and a route-styled element (e.g. a topic TOC link) is inspected in the browser's Styles panel
- **THEN** each matching rule block appears exactly once, not as consecutive duplicates from different stylesheets

#### Scenario: Route CSS content is not fetched twice

- **WHEN** the docs shell's linked stylesheets are concatenated and searched for a route-scoped selector (e.g. `styles_docContainer`)
- **THEN** the selector's rules occur only within the entry CSS bundle, exactly as many times as the source `styles.module.css` defines them
