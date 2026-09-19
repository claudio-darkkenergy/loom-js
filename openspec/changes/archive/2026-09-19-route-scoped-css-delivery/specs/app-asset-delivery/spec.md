# app-asset-delivery Delta

Supersedes the CSS-linking stance of `dedupe-route-css-loading`: route CSS links return to prod shells now that route-owned rules no longer also live in the entry stylesheet.

## MODIFIED Requirements

### Requirement: Route HTML loads only its own assets

Each route's generated HTML SHALL reference the shared chunks plus only that route's JS and CSS. A route's lazily-imported chunk SHALL NOT appear in another route's HTML. Shared CSS (the shared-only entry stylesheet and CSS entry points) SHALL be referenced by every shell; a route's own CSS bundle SHALL be referenced by that route's prod shell only.

#### Scenario: Home shell excludes docs assets

- **WHEN** the client build completes and `build/index.html` is inspected
- **THEN** it references the shared chunks and the pages entry assets, and no `docs-*.js` or `docs-*.css`

#### Scenario: Docs shell excludes home-page assets

- **WHEN** `build/docs/index.html` is inspected
- **THEN** it references the shared chunks and the docs assets, and no `pages-*.js` or `pages-*.css`

#### Scenario: Hard reload works on both shells

- **WHEN** the user hard-reloads `/` and `/docs/get-started` (dev server and production rewrites)
- **THEN** each page boots and renders its route without console module-load errors

## ADDED Requirements

### Requirement: Entry stylesheet carries only shared CSS

The entry CSS bundle SHALL contain only CSS inputs not owned by a single route's chunk. CSS owned by exactly one route SHALL exist only in that route's CSS bundle; CSS reachable from more than one route SHALL remain shared. The union of shared and route bundles SHALL cover every rule of the original entry bundle — nothing dropped, nothing duplicated.

#### Scenario: Route rules absent from entry stylesheet

- **WHEN** the built entry stylesheet is searched for a route-scoped selector (e.g. `styles_docContainer`)
- **THEN** it contains no match, while that route's CSS bundle contains the rules exactly as many times as the source module defines them

#### Scenario: Shared rules stay in the entry stylesheet with cascade order preserved

- **WHEN** the shared-only entry stylesheet is compared with the original all-in-one bundle
- **THEN** shared rules (e.g. pink.css, icon fonts) are present in their original relative order, and a route-styled element's computed styles are unchanged on both routes

### Requirement: SPA navigation loads the next route's CSS at runtime

Shells SHALL inline the build-generated route-assets manifest, and the app SHALL pass it to `createRoutes` so client-side navigation to a not-yet-visited route loads that route's CSS before the route renders.

#### Scenario: Manifest is inlined and wired

- **WHEN** any generated shell is inspected
- **THEN** it inlines the route-assets manifest (route pattern → CSS URLs) ahead of the SPA script, and the app passes that manifest to `createRoutes`

#### Scenario: Client-side navigation is styled without duplication

- **WHEN** the user loads `/` and client-side navigates to `/docs`
- **THEN** the docs CSS bundle is fetched once, docs content renders styled with no flash of unstyled content, and devtools shows each docs rule applied exactly once
