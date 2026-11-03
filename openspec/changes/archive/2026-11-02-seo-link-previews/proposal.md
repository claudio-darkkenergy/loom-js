# Proposal

## Why

Every docs topic ships the same 13-character title, "Docs | Loomjs", because `html.title` is keyed by shell scope rather than route; `og:title` follows it, and the client never updates `document.title` on navigation. Search results and shared links can't tell topics apart. The link-preview image is mark-only, so a card in a feed doesn't name the project.

## What Changes

- `@loom-js/build`: a per-route metadata hook for prerendered routes. It rewrites the injected shell's `<title>`, `og:title`, `description` and `og:description`. This is additive, so it ships as a minor changeset.
- Loom app: each topic is titled "<Topic> | Loomjs docs", with a per-topic description where the content has one. Otherwise it falls back to the site description.
- Loom app: `document.title` follows the route on client-side navigation.
- Brand generator: `og-image.png` and `.github/social-preview.png` gain the "loom" wordmark and the tagline beside the mark.

## Capabilities

### New Capabilities

- `page-metadata`: per-route title and description in the loom app, prerendered and kept in sync on navigation.

### Modified Capabilities

- `build-tool-prerender`: prerendered routes can carry their own head metadata.
- `app-brand-identity`: the link-preview images carry the wordmark and tagline. The capability lands when `loom-logo` archives.

## Impact

- `packages/build/src/config.ts` and `prerender.ts`, the `build-tool` docs topic, and a changeset.
- `apps/loom/loom.config.ts`, the router or app shell for `document.title`, and the prerender entry for topic descriptions.
- `apps/loom/project/client/brand.mts`, `scripts/brand-assets.mts`, and the regenerated preview PNGs.
