# Design

## Context

The header brand cluster is `HeaderBrand` in `apps/loom/src/app/pages/layout.ts`: the mobile side-nav toggle and `BrandLogoLink` (`[mark] loom`), rendered as a fragment into the header's col-1 flex row. Every route renders through `PageLayout`, in the prerender pass and on the client.

`@loom-js/core` is a `workspace:*` dependency, so the app builds against `packages/core` and its `package.json` version. That version changes only when the changesets "Version Packages" PR merges to `main`, and that merge both publishes to npm and triggers the site deploy.

Pink already has the badge: `PinkTag` with `isEyebrowHeading` (its Storybook variant is literally "Beta").

## Goals / Non-Goals

**Goals:**

- Badge and version render in prerendered HTML, so crawlers and no-JS visitors see them.
- The version is checked on every production build.

**Non-Goals:**

- Versions of other packages (pink, build, highlight). Core is the framework the docs describe.
- Retiring the badge at 1.0. That's a later edit to this capability, not automation now.
- A changelog link or "what's new" popover.

## Decisions

**Read the version at build time into a define.** `loom.config.ts` reads `node_modules/@loom-js/core/package.json` (relative to the app, so it's the core the app actually resolves) and passes it as `__CORE_VERSION__`. Core's `exports` map doesn't expose `./package.json`, so a JSON import or `require.resolve` won't reach it; a path read will. The reader lives in `project/client/core-version.mts` next to the other config helpers, throws with the manifest path on a missing file or a non-semver `version`, and gets a `node --test` test.

Alternatives considered:

- _Runtime fetch from `registry.npmjs.org`_: always "latest", but adds a request per visit, renders nothing in prerendered HTML (or a stale value that flips on boot), and fails offline. Because publish and deploy ride the same merge, the build value already is npm `latest`.
- _Literal in source_: a manual edit every release, the thing this avoids.

**Badge and version as one branding component.** A `ReleaseStatus` component in `src/app/components/branding/release-status/`: `PinkTag isEyebrowHeading` "Beta", then an external link `v${__CORE_VERSION__}` styled small and muted. `HeaderBrand` renders it after `BrandLogoLink`. Keeping it out of `BrandLogoLink` keeps the badge from becoming part of the home link's click target and accessible name.

**Give the brand its own row on mobile.** At 375 px the nav already ran past the screen edge (to 472 px) before this change. The badge doesn't move it, but it was the moment to fix it: on mobile the brand cluster spans the first row, and the top nav moves down beside search. That frees the room to show the version on mobile too.

**Assert the version in the prerender `validate` hook.** Same pattern as the footer copyright: every route's `html` must contain `v<version></a>`, else throw naming the route. The match is anchored to the link's closing tag so a code sample quoting a version can't satisfy it. The config already has the version in scope from the define. The app has no browser suite for `src/`, so this is the check on the rendered output.

## Risks / Trade-offs

- [A Release run fails after the merge, so the site shows a version npm doesn't have yet] → The rerun publishes it; the window is minutes. Not worth a registry check in the build.
- [Edge or preview deploys show the same version as `main`] → Correct: edge never bumps versions, so previews describe the published core.
