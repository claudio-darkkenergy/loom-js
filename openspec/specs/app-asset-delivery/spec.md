# app-asset-delivery Specification

## Purpose

Defines what each route's HTML shell in `@loom-js/loom` is allowed to load: production shells reference only their own route's JS/CSS plus shared chunks (dev shells deliberately stay supersets so the dev server's single SPA fallback works), production output carries no development instrumentation, fonts render with swap behavior without blocking on third-party origins, and the LCP hero image ships with real intrinsic dimensions at high fetch priority.

Established by the `web-vitals-contentful-latency` change (2026-08-14), which found route splitting silently defeated (every shell loaded every route's assets) and dev-only code (`EventSource('/esbuild')`, framework debug) shipping in production bundles.

## Requirements

### Requirement: Route HTML loads only its own assets

Each route's generated HTML SHALL reference the shared chunks plus only that route's JS and CSS. A route's lazily-imported chunk SHALL NOT appear in another route's HTML.

#### Scenario: Home shell excludes docs assets

- **WHEN** the client build completes and `build/index.html` is inspected
- **THEN** it references the shared chunks and the pages entry assets, and no `docs-*.js` or `docs-*.css`

#### Scenario: Docs shell excludes home-page assets

- **WHEN** `build/docs/index.html` is inspected
- **THEN** it references the shared chunks and the docs assets, and no `pages-*.js` or `pages-*.css`

#### Scenario: Hard reload works on both shells

- **WHEN** the user hard-reloads `/` and `/docs/get-started` (dev server and production rewrites)
- **THEN** each page boots and renders its route without console module-load errors

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
