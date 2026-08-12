## Why

The Contentful-caching follow-up from `fix-per-render-hook-leaks` turned out to be already satisfied: `request` (`lib/utils/src/http/request.ts`) unconditionally caches every successful response by full request signature, so repeated docs-topic visits already skip the network. What the investigation exposed instead are three latent defects in that util: the `cacheKey` bust comparison checks the stored key array against itself (dead code — the cache can never be busted), concurrent identical requests abort each other's in-flight fetch (the first caller receives an error instead of sharing the result), and the `pendingRequests` bookkeeping is inverted (deletes the entry while requests are pending, leaks empty queues forever). `lib/utils` also still has no test runner — promised since `fix-per-render-hook-leaks` design D6 — and `request` is exactly the logic that needs one.

## What Changes

- Fix the `cacheKey` bust to compare the **incoming** `init.cacheKey` against the stored key array, busting the cached entry when any element differs.
- Replace abort-the-previous-request with **single-flight sharing**: concurrent calls with the same signature await one shared fetch and all receive its result.
- Replace the `pendingRequests` `Set<AbortController>` machinery with an in-flight promise registry (per-flight `AbortController` retained for the timeout path); entries are removed when the flight settles.
- Stand up `@web/test-runner` for `@loom-js/utils` (mirroring `packages/core`'s config: esbuild plugin, puppeteer, chai + sinon, `tests/tsconfig.json`, `test-ci`/`test-dev`/`type-check-tests` scripts) with unit specs pinning the cache, bust, single-flight, and timeout behavior against a stubbed `fetch`.

Out of scope: TTL/expiry policy for the response cache (permanent per-session caching is intentional today), any change to `useSelectedPage`/`useSelectedTopic` (they inherit the fixes), and the known quirk that function-valued init fields (`adapter`) are dropped from the JSON signature (unchanged behavior, documented).

## Capabilities

### New Capabilities

- `http-request-caching`: `request` caches successful responses per request signature, busts the cache when the caller's `cacheKey` changes, shares a single in-flight fetch among concurrent identical calls, and cleans up its in-flight registry when requests settle.

### Modified Capabilities

<!-- none -->

## Impact

- `lib/utils/src/http/request.ts` — bust fix, single-flight rewrite, registry cleanup.
- `lib/utils/package.json`, `lib/utils/web-test-runner.config.mjs`, `lib/utils/tests/**` — new test infra and specs.
- No consumer-facing API change; `@loom-js/utils` is private — no changeset.
