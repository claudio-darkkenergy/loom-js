# Tasks — Web Vitals & Contentful Latency

## 1. Sweep 1 — Content latency

- [x] 1.1 Resolve design open question D2: verify whether Vercel's edge cache honors `s-maxage` on POST responses from edge functions (docs + a probe on a preview deploy); record the answer in design.md and pick plan A (POST + `s-maxage`) or plan B (hashed-GET/persisted query)
- [x] 1.2 Flip preview semantics (design D1): `build.mts`/`dev.mts` define `__CTF_IS_PREVIEW__` from `process.env.CTF_IS_PREVIEW === 'true'`; remove the `?? true` fallbacks in `get-page.ts`, `get-content.ts`, `get-site.ts`; audit Vercel env vars so every environment sets the flag deliberately
- [x] 1.3 Add `Access-Control-Max-Age: 86400` to OPTIONS handling in `services/utils/edge/edge-response.ts` (design D3)
- [x] 1.4 Add CDN cache headers to `services/api/contentful/graphql.ts` for non-preview requests per 1.1's chosen plan; preview requests respond `Cache-Control: no-store` (design D2)
- [x] 1.5 Pass through the full GraphQL envelope in `edge-response.ts` (stop rewrapping as `{ data: data?.data }`); confirm existing client adapters tolerate the added `errors` key (design D6)
- [x] 1.6 Surface errors in the app: content adapters treat a response with `errors` and no items as a failed load; docs page renders an error state instead of a permanent skeleton
- [x] 1.7 Merge the docs side-nav and topic-body queries into one GraphQL document (design D4): new query in `logic/providers/contentful/lib/queries.ts`, single fetch in `useDocsLayout` fanning out to the `page` and `topic` activities
- [x] 1.8 Stop resetting the `topic` activity to `undefined` before fetching in `use-selected-topic.ts` so cached topics render without a skeleton flash (design D5)
- [x] 1.9 Remove dead content code flagged in recon: `useSelectedSite` (with its stray `console.log`), `getContentById`, unused queries/fragments (`pageContentById`, `pageContentBySlug`, `pageFields`, unused `shortContentFields` import)
- [x] 1.10 Re-measure: Lighthouse on `/` and `/docs/get-started` plus timed curl of the proxy; record numbers vs. baseline in the change notes

## 2. Sweep 2 — Asset delivery

- [x] 2.1 Fix route asset scoping (design D7): pass `entryPoints` to `htmlSplit` in `config.mts` and filter both JS and CSS by `args.scope` in `template.html.mts`; verify `build/index.html` and `build/docs/index.html` each reference only their own route assets; if the plugin itself must change, include a changeset
- [x] 2.2 Fix the dev SPA fallback so a hard reload on `/docs/*` serves a working shell after 2.1 (currently `dev.mts` falls back to the home shell)
- [x] 2.3 Give each route shell its own `<title>` (drop the hardcoded `getTitle: () => 'Home | Loomjs'`)
- [x] 2.4 Exclude dev-only code from prod output (design D8): guard `new EventSource('/esbuild')` and the framework `debug` config in `bootstrap.ts` behind a build-time define; confirm neither appears in the minified bundle
- [x] 2.5 Font policy (design D9): add `font-display: swap` to all `@font-face` in `pelinka.css`; remove the render-blocking MyFonts `@import` (first checking the license's count-pixel requirement — if required, load it async); preload above-the-fold weights; drop unused weights/woff variants
- [x] 2.6 Hero image (design D9): pass real `width`/`height` from `pages/index.ts` through `HeroBanner`, add `fetchpriority="high"`; remove the invalid `'auto'` attribute defaults
- [x] 2.7 Trim render-blocking CSS: audit what the app actually uses from `@appwrite.io/pink`/`pink-icons`, drop the unused import(s) or scope them, eliminating the 1.5 MB icon sprite if unreferenced; remove dead `rollbar.js`/`brand.js` copies from the build config
- [x] 2.8 Verify no visual regressions on `/`, `/docs`, `/docs/get-started` (fonts, icons, layout) in dev and a production build
- [x] 2.9 Re-measure: same Lighthouse procedure; record numbers vs. Sweep 1 in the change notes

## 3. Sweep 3 — Verify & hold the line

- [x] 3.1 Produce a prod-parity measurement: `pnpm build` + static serve (or Vercel preview URL) and run the Lighthouse procedure against it; record the authoritative before/after table in the change notes
- [x] 3.2 Document the measurement procedure (commands, URLs, cold-profile notes, dev vs. prod caveats) in the change so regressions are re-checkable
- [x] 3.3 Confirm both new specs' scenarios pass by walking each scenario against the built app; note any deferred follow-ups (SSR/prerender, Pink purge, cache-purge webhook) as future change candidates
