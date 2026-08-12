## Context

`request` keys everything on `reqSignature = JSON.stringify({ input, init })`. Successful responses land permanently in `requestDataCache` (this is why docs topics don't refetch — working as designed). Three defects sit around that core:

1. **Bust dead code:** `cacheKey.some((key, i) => !Object.is(key, cacheKey[i]))` destructures the _stored_ `cacheKey` and compares it to itself — always false. The incoming `init.cacheKey` is never consulted after the `has` check.
2. **Abort-the-sibling:** a second call with the same signature aborts every controller in the shared queue before fetching, so the first caller's `fetch` rejects with `AbortError` and it returns `{ error, status: 0 }`. This was built for the old N-duplicate-watchers world (kill stale repeats); after `fix-per-render-hook-leaks` the remaining concurrency case is _legitimate_ callers wanting the same resource.
3. **Inverted bookkeeping:** `controllerQueue.size && pendingRequests.delete(reqSignature)` runs after the current controller is deleted — it removes the shared entry exactly when _other_ requests are still pending, and leaves empty queues in the map forever when they aren't.

`lib/utils` has no test runner; `packages/core`'s wtr setup (esbuild plugin + puppeteer + `@esm-bundle/chai` + sinon, single `tests/tsconfig.json` consumed by both tsserver and wtr's transform) is the repo pattern to mirror. `fetch` is stubbable with sinon in the browser environment.

## Goals / Non-Goals

**Goals:**

- A changed `cacheKey` busts the cached entry; an unchanged one serves from cache.
- Concurrent identical requests resolve from one shared fetch; both callers get the same successful result.
- The in-flight registry holds entries only while a flight is airborne.
- `request`'s behavior is pinned by unit specs runnable via `pnpm -F @loom-js/utils test-ci`.

**Non-Goals:**

- Cache TTL/expiry, cache size bounds, or a purge API (`CacheKeyPurger` is commented out upstream — future work).
- Changing the signature scheme (function-valued fields like `adapter` serialize away; two calls differing only by adapter share a signature — pre-existing, now documented).
- Abort semantics for _different_-signature requests (none exist today; none added).

## Decisions

**D1 — Bust compares incoming key to stored key, element-wise.** `init.cacheKey.some((key, index) => !Object.is(key, storedCacheKey?.[index]))` — plus a length check so shrinking/growing keys bust too. Rationale: `Object.is` element comparison matches the original intent (the stored shape is `any[]`); a JSON compare would false-positive on NaN and function members.

**D2 — Single flight via a `Map<string, Promise<ApiProviderResponse>>`.** First uncached call creates the flight (the whole fetch-parse-adapt-cache pipeline as one promise), stores it, and removes it in a `finally`. Callers that arrive while the flight is airborne await the same promise. The abort-previous behavior is deleted — its purpose (staleness control for duplicate watchers) is obsolete, and its effect on legitimate concurrent callers is a spurious error. Error results are returned (not thrown) exactly as today, and **error results are not cached** — the next call retries (matches current behavior, where only successful responses enter `requestDataCache`).

**D3 — Timeout aborts the shared flight.** One `AbortController` per flight; the existing `init.timeout` setTimeout aborts it if the flight is still registered when the timer fires. All sharers receive the same `{ error, status }` result. The `pendingRequests` `Set` machinery is deleted outright — the flight registry subsumes it.

**D4 — Test infra mirrors core exactly.** `web-test-runner.config.mjs` (esbuild plugin pointing at `tests/tsconfig.json`, puppeteer, coverage over `src/*`), `tests/tsconfig.json` extending the package tsconfig with `types: ["mocha", "node"]`, devDeps copied from core's test set, scripts `test-ci`/`test-dev`/`type-check-tests`. Specs stub `window.fetch` with sinon and use per-test unique URLs so the module-level caches (which persist across tests in one page) can't cross-contaminate.

## Risks / Trade-offs

- [Behavior change: the second concurrent caller no longer cancels the first] → Intended; the cancel-on-repeat semantics predate the watcher-leak fixes and only manifest as spurious errors now. Repo callers (`graphQlRequest` → Contentful hooks, `mockRequest`) are all better served by sharing.
- [Shared error results: all concurrent sharers see one failure] → Matches what each would likely get independently; errors stay uncached so recovery is one retry away.
- [Test infra adds heavyweight devDeps (puppeteer) to `lib/utils`] → Same versions as core, so pnpm shares the store; CI cost is one more small wtr run.
- [Prettier import-sort: `lib/utils/package.json` is already listed in `.prettierrc` `packageJSONFiles`?] → Verify during implementation; add it if missing so new devDep imports sort as NPM packages.
