# app-asset-delivery Specification

## Purpose

Defines what each route's HTML shell in `@loom-js/loom` is allowed to load: production shells reference only their own route's JS/CSS plus shared chunks (dev shells deliberately stay supersets so the dev server's single SPA fallback works), production output carries no development instrumentation, fonts render with swap behavior without blocking on third-party origins, and the LCP hero image ships with real intrinsic dimensions at high fetch priority.

Established by the `web-vitals-contentful-latency` change (2026-08-14), which found route splitting silently defeated (every shell loaded every route's assets) and dev-only code (`EventSource('/esbuild')`, framework debug) shipping in production bundles. Amended by the `dedupe-route-css-loading` change (2026-08-23), which scoped the CSS expectations to shared stylesheets only and required each CSS rule to reach the browser exactly once.

## Requirements

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

### Requirement: Each CSS rule is delivered exactly once

Across all stylesheets referenced by a route's HTML shell, any given CSS rule SHALL reach the browser exactly once. No rule may be applied twice because two linked stylesheets contain the same content.

#### Scenario: Route-level rules apply once in devtools

- **WHEN** the docs page is loaded and a route-styled element (e.g. a topic TOC link) is inspected in the browser's Styles panel
- **THEN** each matching rule block appears exactly once, not as consecutive duplicates from different stylesheets

#### Scenario: Route CSS content is not fetched twice

- **WHEN** the docs shell's linked stylesheets are concatenated and searched for a route-scoped selector (e.g. `styles_docContainer`)
- **THEN** the selector's rules occur only within the entry CSS bundle, exactly as many times as the source `styles.module.css` defines them

### Requirement: Production output contains no dev-only code

Development instrumentation — the esbuild live-reload `EventSource`, framework debug logging, and sourcemaps — SHALL be excluded from production build output via build-time elimination, not runtime checks.

#### Scenario: No live-reload connection in production

- **WHEN** the production bundle is built and served
- **THEN** no request to `/esbuild` is made and the string `EventSource('/esbuild')` does not appear in the output

#### Scenario: No debug logging in production

- **WHEN** the production app boots
- **THEN** framework debug console output is disabled and the debug configuration is absent from the bundle

### Requirement: Fonts render with swap behavior and no third-party blocking

All `@font-face` declarations SHALL specify `font-display: swap`, and the CSS chain SHALL NOT block rendering on any third-party origin.

#### Scenario: Text is visible before fonts load

- **WHEN** the page renders while webfonts are still downloading
- **THEN** text paints in a fallback font and swaps when the webfont arrives

#### Scenario: No render-blocking third-party CSS

- **WHEN** the built CSS chain is inspected
- **THEN** it contains no `@import` referencing an external origin

### Requirement: The LCP image is dimensioned and prioritized

The home hero image SHALL carry valid intrinsic `width`/`height` attributes matching its rendered aspect ratio and SHALL be requested with high fetch priority in a compressed format (webp) at an appropriate size.

#### Scenario: Aspect ratio is reserved before load

- **WHEN** the home page renders before the hero image has loaded
- **THEN** the image's box is reserved (no layout shift attributable to the hero) because its `width`/`height` attributes are valid integers

#### Scenario: Hero is fetched at high priority

- **WHEN** the home page loads
- **THEN** the hero image request carries `fetchpriority="high"` and serves webp at the requested width
