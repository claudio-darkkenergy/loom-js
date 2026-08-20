# Design — Web Vitals & Contentful Latency

## Context

Measured baseline (Lighthouse 12, mobile simulation, dev server, 2026-08-14): home 71 perf / FCP 3.9 s / LCP 5.3 s; `/docs/get-started` 64 perf / FCP 3.9 s / LCP 5.9 s / CLS 0.078. The docs LCP element is the topic rich text — i.e. LCP is gated on the Contentful fetch chain.

The content path today (all file refs verified against the working tree):

```
HTML (empty <body>) → spa.js + route chunks parse → route match
  → dynamic import docs chunk → DocsLayout → useDocsLayout()
    → 2 parallel POSTs to ${__API_URL__}/api/contentful/graphql
      → CORS preflight (~760 ms measured; no Access-Control-Max-Age)
      → edge proxy → graphql.contentful.com (Preview API, uncached)
```

Key facts driving the design:

- `isPreview` defaults to `true` (`get-page.ts:32`, `get-content.ts:21/:37`, `get-site.ts:24`; `build.mts:8` uses `process.env.CTF_IS_PREVIEW !== 'false'`). Contentful's Preview API bypasses its CDN.
- The proxy (`services/api/contentful/graphql.ts`) sets no `Cache-Control`; `edge-response.ts` sets no `Access-Control-Max-Age` and rewraps responses as `{ data: data?.data }`, silently dropping GraphQL `errors`.
- Route splitting is defeated: `htmlSplit` is called without `entryPoints` (`config.mts:42-52`), so `checkIsEntryPoint` treats dynamic-import chunks as entries and both `pages-*.js`/`docs-*.js` land in every page's HTML; `template.html.mts` concats all CSS unscoped.
- `bootstrap.ts:13` opens `new EventSource('/esbuild')` unconditionally; `bootstrap.ts:50-59` enables framework `debug` unconditionally.
- `public/styles/base.css` → `pelinka.css` → `@import '//hello.myfonts.net/count/40024c'` is a serial, render-blocking, third-party CSS waterfall; no `@font-face` sets `font-display`.
- Hero image renders `width="auto" height="auto"` (`HeroBanner.ts:42-44` defaults, `pages/index.ts:29-36` passes none) — invalid values, no aspect-ratio reservation, no `fetchpriority`.
- Client cache: `lib/utils/src/http/request.ts` caches successful responses per signature with single-flight dedupe (specced in `http-request-caching`) — but `use-selected-topic.ts:11-12` resets the activity to `undefined` before every fetch, so even cache hits flash the skeleton.

## Goals / Non-Goals

**Goals:**

- Cut time-to-content on docs routes from ~1.9 s (localhost) to one edge-cached round trip; make production reads hit Contentful's CDN-cached Delivery API.
- Make each route's HTML load only its own assets; remove dev-only code from prod output.
- Eliminate the known CLS sources (font swap policy, image dimensions, TOC pop-in is out of scope unless trivial).
- Re-measure after each sweep with the same Lighthouse procedure so improvement is attributable.

**Non-Goals:**

- SSR/prerendering. The `htmlSplit` plugin has an unused `prerender` option; adopting it is a larger architectural change and is deferred (noted as the natural follow-up if FCP is still poor after Sweep 2).
- Redesigning the client `request` cache (TTL, purge) — `http-request-caching` stays as-is.
- Replacing the proxy with direct-to-Contentful client calls (would expose the token or require a public token strategy).
- Purging/theming the Pink design system beyond mechanical trimming — a full CSS-budget effort is its own change if trimming falls short.

## Decisions

### D1 — Preview becomes explicit opt-in (`CTF_IS_PREVIEW === 'true'`)

Flip the build-time define from `!== 'false'` (default-on) to `=== 'true'` (default-off) in `build.mts`/`dev.mts`, and drop the `?? true` fallbacks in the providers. Rationale: preview is the exception (content-team draft review), production traffic must never pay the uncached Preview API. Alternative — leaving the define alone and setting env per environment — rejected because a missing env var silently reverts to the slow path; fail-fast defaults should favor production behavior.

Local dev keeps `CTF_IS_PREVIEW=true` in `.env.local` so authors still see drafts; the semantics change is only in the default.

### D2 — Cache at the proxy edge, not in the client

`graphql.ts` adds `Cache-Control: public, s-maxage=<minutes>, stale-while-revalidate=<hours>` for **non-preview** requests (preview responses stay uncacheable).

**Resolved 2026-08-14 (task 1.1):** Vercel's CDN cache documentation is explicit — a response is cacheable only when the "Request uses `GET` or `HEAD` method" (vercel.com/docs/caching/cdn-cache, "Cacheable response criteria"). POST responses are never edge-cached, so **plan B is the decision**: content requests become `GET ${url}?q=<base64url(JSON.stringify({query, variables}))>`, the handler decodes `q` and proxies upstream as before. POST support remains for preview mode and backward compatibility. Two additional consequences favor GET: (1) a GET with no custom request headers is a CORS _simple request_, so the ~760 ms preflight disappears from the content path entirely (D3's `Access-Control-Max-Age` stays for the remaining POST/preview path); (2) the cache key is the full URL, so distinct queries/variables cache independently with no key-design work. Encoded query size (~1 KB) is far below URL limits. Also per the criteria, the cached response must avoid `no-cache`/`no-store`/`private` and the request must carry no `Authorization` header (the client sends none — auth is injected server-side). Alternative — client-side localStorage caching — rejected: helps only repeat visitors, does nothing for FCP-critical first loads, and duplicates the existing session cache.

### D3 — Kill the preflight tax with `Access-Control-Max-Age`

`edge-response.ts` OPTIONS handling adds `Access-Control-Max-Age: 86400`. This is a one-line, zero-risk win (~1 serialized RTT per content request per 5 s today). Merging origins (serving the API from the app's origin via rewrites) would remove preflights entirely but changes deployment topology — out of scope.

### D4 — One GraphQL document per docs navigation

Merge the side-nav listing query (`useSelectedPage`) and topic-body query (`useSelectedTopic`) into a single document with two aliased root fields. The two hooks keep their activities; a single fetch fans out into both `update()` calls. Rationale: halves request count, and with D2/D3 makes the docs route one cached round trip. Alternative — keeping two POSTs — rejected since both hit the same endpoint with the same auth and lifecycle.

### D5 — Don't blank cached content

`useSelectedTopic` stops resetting the activity to `undefined` before fetching. Skeletons still show when there's genuinely no data (initial `undefined`); when navigating to a cached topic the old content swaps directly to the new content. Stale-while-navigating (showing the previous topic while the next loads) is explicitly acceptable per the activity/effect idiom — the effect re-renders on `update()`.

### D6 — Surface GraphQL errors

`edgeResponse` passes through the full GraphQL envelope (`data`, `errors`) instead of `{ data: data?.data }`. The content adapters treat a response with `errors` and no usable `items` as a failed request (which `request.ts` already declines to cache), and the docs page renders an error state instead of an eternal skeleton. This fixes a real correctness bug found during recon.

### D7 — Fix route scoping at the call site, not (necessarily) the plugin

Pass `entryPoints` to `htmlSplit` in `config.mts` so `checkIsEntryPoint` can distinguish true entries from dynamic-import chunks, and make `template.html.mts` filter both JS **and** CSS by `args.scope`. Only touch `esbuild-plugin-html-split` itself if the app-side fix is insufficient (if it is touched, it needs a changeset + version bump). Rationale: the plugin already supports the correct behavior when given `entryPoints`; prefer the consumer-side fix to avoid a publish cycle.

### D8 — Dev-only code behind a build-time define

Add a `__DEV__` (or reuse `isProd`) esbuild define; wrap the `EventSource('/esbuild')` reconnect hook and the framework `debug` config in it so esbuild dead-code-eliminates both from prod output. Alternative — runtime `location.hostname` checks — rejected: keeps the bytes in the bundle.

### D9 — Font and image delivery policy

- `font-display: swap` on all `@font-face` in `pelinka.css`; remove the MyFonts count `@import` from the CSS chain (license bookkeeping, if required, moves to an async non-blocking mechanism); preload only the one or two weights used above the fold; drop unused weights/woff (keep woff2).
- Hero image: pass real `width`/`height` (320×320 is what's requested from Contentful) so the browser reserves the box, plus `fetchpriority="high"`; docs/topic images stay lazy.

### D10 — Measurement procedure is part of the change

Lighthouse CLI (`npx lighthouse@12 <url> --only-categories=performance --chrome-flags="--headless=new"`) against `/` and `/docs/get-started`, cold profile, recorded before/after each sweep in the change's notes. Dev-server numbers are directional only (no minify/compression); the procedure notes that prod-parity checks (minified build via `pnpm build` + a static serve, or a Vercel preview URL) are the authoritative pass gate for Sweep 3.

## Risks / Trade-offs

- [Vercel edge may not cache POST responses] → Plan B in D2: hashed-GET/persisted-query form of the proxy. Verify before building on `s-maxage`.
- [`s-maxage` serves stale content after publishes] → Short `s-maxage` (minutes) + long `stale-while-revalidate`; content updates propagate within minutes, which fits a docs site. A purge webhook is future work.
- [Flipping `CTF_IS_PREVIEW` semantics breaks an environment that relied on default-preview] → Audit Vercel env vars for all environments as part of the sweep; set values explicitly everywhere.
- [Merged GraphQL document (D4) grows past complexity limits or over-fetches for non-docs routes] → It only replaces the two docs-route queries; home keeps its build-time content path.
- [Route-scoping fix (D7) breaks the SPA fallback in dev (`dev.mts` serves the home shell for `/docs/*`)] → Dev fallback must point at the docs shell for docs paths or keep a superset shell in dev only; verify hard-reload on `/docs/x` in both modes.
- [Trimming Pink CSS/sprite breaks icon rendering] → Trim mechanically (only what grep proves unused), verify Storybook/pages visually; full purge is out of scope.
- [Removing the MyFonts `@import` may violate the font license's count-pixel requirement] → Check the license terms; if required, load it async (`media="print"` swap or JS beacon) instead of render-blocking CSS.

## Migration Plan

1. Sweep 1 (proxy + providers) ships first — server changes are backward-compatible with old clients (envelope now includes `errors`; old client ignored it… verify `request.ts` adapters tolerate the extra key before deploy).
2. Sweep 2 (build/HTML/CSS) is a pure build-output change; verify via preview deploy + hard reloads on `/`, `/docs`, `/docs/get-started`.
3. Rollback for either sweep is a revert; no data or schema migrations. If the plugin is versioned (D7 fallback), pin the app to the prior version to roll back.

## Open Questions

- Does Vercel's edge cache honor `s-maxage` on POST responses from edge functions? (Determines D2 plan A vs. B — check first, it shapes Sweep 1's proxy task.)
- Is the MyFonts count pixel contractually required for the Pelinka license?
- Are there production environments intentionally running preview mode (e.g. a content-staging deploy) that need `CTF_IS_PREVIEW=true` set explicitly after D1 flips the default?
