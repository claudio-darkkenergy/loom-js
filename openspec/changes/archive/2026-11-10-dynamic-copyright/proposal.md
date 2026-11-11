# Proposal

## Why

The loom app footer reads `© 2024`, a string literal in `apps/loom/src/app/pages/layout.ts`. Nothing updates it, so the site has shown a stale year since January 2025 and goes staler every year. Contentful holds no copyright content, so the layout is the only source.

## What Changes

- The footer's copyright year comes from the clock at render time instead of a literal: `© <current year>`.
- Prerender bakes the build year into the static HTML. Hydration swaps in a client-rendered tree, which shows the visitor's current year, so a page built in December reads correctly in January once the client boots.
- No Contentful field, no build define, no core or pink change.

## Capabilities

### New Capabilities

- `app-site-footer`: what the loom app's site footer shows. Starts with the copyright notice; later footer content (links, credits) joins it.

### Modified Capabilities

None.

## Impact

- `apps/loom/src/app/pages/layout.ts`: the footer line.
- The prerendered HTML for every route carries the build year in the footer.
- No dependency, API, or Contentful change.
