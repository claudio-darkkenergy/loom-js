# Measurement Notes

Procedure: `npx -y lighthouse@12 <url> --only-categories=performance --chrome-flags="--headless=new"` (mobile simulation, cold profile) against the dev server (`localhost:9092` + `vercel dev` API on `:2000`). Dev numbers are directional — no minification/compression, and `vercel dev` adds per-request function overhead that Vercel's edge does not; the CDN cache (`s-maxage`) also only exists on real Vercel infra, so repeat-read wins do not show locally.

## Baseline (2026-08-14, pre-change)

| Route               | Perf | FCP   | LCP   | CLS   | TBT    |
| ------------------- | ---- | ----- | ----- | ----- | ------ |
| `/`                 | 71   | 3.9 s | 5.3 s | 0     | 0 ms   |
| `/docs/get-started` | 64   | 3.9 s | 5.9 s | 0.078 | 230 ms |

Content path on docs: 2 × CORS preflight (~760 ms, uncached) + 2 × GraphQL POST (~1.0–1.1 s each) through the proxy; Preview API by default; no cache headers anywhere.

## After Sweep 1 (2026-08-14, content latency)

| Route               | Perf | FCP   | LCP   | CLS    | TBT  |
| ------------------- | ---- | ----- | ----- | ------ | ---- |
| `/`                 | 70   | 3.9 s | 5.3 s | 0.078¹ | 0 ms |
| `/docs/get-started` | 69   | 3.9 s | 5.4 s | 0.078  | 0 ms |

¹ Home CLS regressed 0 → 0.078 across runs — run-to-run variance around the un-dimensioned hero image; Sweep 2 task 2.6 adds intrinsic dimensions.

Content path on docs now: **one** GET request (`?q=` base64url document), **zero preflights** (simple request). Local proxy timing: ~0.73–0.9 s per request via `vercel dev` (curl, warm). Direct-to-Contentful RTT is ~65 ms, so most of the remaining local latency is `vercel dev` overhead that production edge functions don't pay; production non-preview responses now carry `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` so repeats are edge-cache hits.

Also verified in-browser: cached-topic navigation renders instantly with no skeleton flash and no network request; uncached topic navigation costs exactly one GET.

## After Sweep 2 (2026-08-14, asset delivery — prod-parity measurement)

Production build (`NODE_ENV=production`, minified, `CTF_IS_PREVIEW=false`) served by a local static server that mirrors `vercel.json` rewrites (`/docs` → 302 `/docs/get-started`, `/docs/*` → docs shell, SPA fallback → home shell) **with gzip** (Vercel serves brotli/gzip; without compression the numbers are ~13 points lower and misattribute the cost):

| Route               | Perf   | FCP   | LCP   | CLS   | TBT  |
| ------------------- | ------ | ----- | ----- | ----- | ---- |
| `/`                 | **90** | 1.8 s | 3.3 s | 0.078 | 0 ms |
| `/docs/get-started` | **90** | 2.4 s | 3.0 s | 0.079 | 0 ms |

Versus baseline: home 71 → 90 (LCP 5.3 s → 3.3 s), docs 64 → 90 (LCP 5.9 s → 3.0 s), FCP 3.9 s → 1.8–2.4 s. Verified in the built output: route-scoped shells (home HTML has no `docs-*` assets and vice versa, per-route titles), no `EventSource`/debug in prod bundles, fonts down from ~16 files to 2 woff2 with `font-display: swap`, no third-party CSS `@import`, hero `<img>` at `320×320` + `fetchpriority="high"` + `loading="eager"`.

Residual (follow-up candidates, noted for a future change):

- CLS ~0.078 on both routes is a **footer shift** (font-swap metric reflow), not the hero — fixable with `size-adjust`/metric-override fallback fonts.
- FCP/LCP are now bounded by the client-rendered shell + 37 KB gz render-blocking Pink CSS — the next big lever is the `htmlSplit` `prerender` option (SSR/prerender, an explicit non-goal of this change) and/or a real Pink purge.
- Contentful edge caching (`s-maxage`) and preview-mode behavior can only be end-to-end confirmed on real Vercel infra — worth one check on the next preview deploy (`x-vercel-cache: HIT` on a repeat content GET).

## Spec-scenario walk (task 3.3)

- `content-delivery-performance`: single GET per docs navigation ✅ (browser-verified); no preflight on content GETs ✅; `Access-Control-Max-Age: 86400` on OPTIONS ✅; non-preview `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400` ✅; preview → `no-store` ✅; cached-topic navigation renders with no skeleton flash and no request ✅ (MutationObserver-verified); first visit shows skeleton ✅; GraphQL validation errors → HTTP 400 + `no-store`, client renders error state (server half curl-verified; app half via adapter-throw + `ContentLoadFailure` rendering, type-checked) ✅.
- `app-asset-delivery`: shell scoping, hard reloads on both shells (prod server), no dev code in prod, `font-display: swap`, no external `@import`, hero dimensions/priority — all ✅ as above. Dev hard reloads use the deliberate superset shell (template scoping only activates for prod builds).
- `http-request-caching` delta: adapter-throw → uncached error result implemented in `lib/utils/src/http/request.ts`; no test infra exists for `lib/utils` (core-only test suite), so covered by review + the live 400-path check.

## Deviations from the original task text

- 2.2: solved by keeping **dev** shells as supersets (scoping only in prod) instead of changing the dev fallback file — the dev server serves one fallback, so a scoped shell can never work there.
- 2.5: font **preload** skipped — esbuild hashes font filenames and the HTML template has no access to the mapping; `font-display: swap` covers the FOIT risk. MyFonts count beacon kept (license safety) but fired as an async `no-cors` fetch from `bootstrap.ts` instead of render-blocking CSS; confirming whether the license still requires it is an open item.
- 2.7: the Pink CSS import stays (utilities and `icon-*` classes are in active use; full purge is a design non-goal). The 1.5 MB icon sprite is build-output weight only — it is not fetched at runtime, so it costs disk, not vitals. `rollbar.js`/`brand.js` were initially removed, then restored in review — they're inert (copied, never referenced or fetched) and kept for potential future use.

Deploy note (task 1.2 audit): the linked Vercel project (`loom-js-services`) sets `CTF_HOST` / `CTF_TOKEN` / `CTF_SPACE_ID` but has **no `CTF_IS_PREVIEW`** — under the old `!== 'false'` default that meant deployed builds ran preview mode. The app's own Vercel project (separate from services) should be checked the same way; with the new `=== 'true'` semantics, unset now safely means Delivery API, and any content-staging environment that wants previews must set `CTF_IS_PREVIEW=true` explicitly.
