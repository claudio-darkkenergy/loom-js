# Tasks

## 1. Build tool

- [x] 1.1 Add `prerender.meta` to `PrerenderOptions` and rewrite `<title>`, `og:title`, `description` and `og:description` per route in `prerender.ts`, escaping values. Verify: `pnpm -F @loom-js/build test-ci` with a fixture route that sets both fields and one that sets neither.
- [x] 1.2 Update the `build-tool` docs topic and add a minor changeset for `@loom-js/build`.

## 2. Loom app

- [x] 2.1 Add `topicTitle()` and wire `prerender.meta` in `loom.config.ts`, with the topic summary or the site-description fallback. Verify: an isolated prod build has distinct titles and descriptions per topic.
- [x] 2.2 Set `document.title` on route change from the same helper. Verify: navigating between topics in `pnpm -F @loom-js/loom dev` updates the tab title.

## 3. Preview images

- [x] 3.1 Add the wordmark and tagline to the OG and social-preview renders in `brand-assets.mts`, with the font inlined. Regenerate, and check legibility at 600 px. Verify: `pnpm -F @loom-js/loom test-ci` passes.

## 4. Post-deploy

- [x] 4.1 Re-run opengraph.xyz and LinkedIn's Post Inspector on a topic URL. Verify: the topic title, description and new image show, and the title and description warnings are gone.
