# Proposal

## Why

Nothing on the loom site says the framework is pre-1.0 or which release the docs describe. A visitor can't tell that APIs may still break, or whether the docs match the `@loom-js/core` they just installed.

## What Changes

- The site header shows a "Beta" badge next to the brand logo on every route.
- Beside it, the header shows the `@loom-js/core` version the site was built against (`v0.22.0`), linking to the package's npm page.
- The version is read from core's `package.json` at build time, not hard-coded and not fetched from the registry. Versions only change through the changesets "Version Packages" merge, which also publishes to npm and redeploys the site, so the built version is the npm `latest`.
- Prerender bakes both into every route's HTML, and the validate hook fails the build if a route renders without the version.
- No core, pink or Contentful change.

## Capabilities

### New Capabilities

- `app-release-status`: how the loom app tells visitors the framework's maturity and the core version the site documents. Starts with the beta badge and the version; it changes again when core goes 1.0 and the badge retires.

### Modified Capabilities

None.

## Impact

- `apps/loom/loom.config.ts`: a `__CORE_VERSION__` define read from `@loom-js/core`'s installed `package.json`, plus a prerender validate check.
- `apps/loom/src/app/pages/layout.ts` (header brand cluster) and a new branding component.
- `apps/loom/src/app/types/declarations.d.ts`: the define's declaration.
- `apps/loom/project/client/`: the version reader and its `node --test` test.
- No dependency or API change.
