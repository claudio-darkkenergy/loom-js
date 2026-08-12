## 1. Groundwork — test infra (needed before red)

- [x] 1.1 Audit Rule check: no open entries for `lib/utils/src/http/*` (none known); note `.prettierrc` `packageJSONFiles` already lists `lib/*/package.json` or add it
- [x] 1.2 Mirror core's wtr setup into `lib/utils`: devDeps (`@web/test-runner`, `@web/test-runner-puppeteer`, `@web/dev-server-esbuild`, `puppeteer`, `@esm-bundle/chai`, `sinon`, `@types/{chai,mocha,sinon,node}`), `web-test-runner.config.mjs`, `tests/tsconfig.json`, scripts `test-ci`/`test-dev`/`type-check-tests`; `pnpm install`
- [x] 1.3 Smoke-check the runner with a trivial passing spec, then delete it (or fold it into 2.x)

## 2. Red — specs first (tdd-workflow)

- [x] 2.1 Failing specs for signature caching: repeat call served from cache (fetch stub called once); failed response not cached (retry fetches)
- [x] 2.2 Failing specs for cacheKey bust: changed key re-fetches; unchanged key stays cached (these fail today because the bust is dead code)
- [x] 2.3 Failing specs for single flight: two concurrent same-signature calls → one fetch, both resolve with data, neither errors; registry clean after settle (fresh fetch after a failed flight)

## 3. Green — implementation

- [x] 3.1 Fix the bust comparison per design D1 (incoming vs stored, element-wise + length)
- [x] 3.2 Replace abort-previous + `pendingRequests` with the in-flight promise registry per D2/D3 (timeout aborts the shared flight; registry entry removed on settle; error results uncached)
- [x] 3.3 `pnpm -F @loom-js/utils test-ci` green; `type-check` + `type-check-tests` green

## 4. Verification

- [x] 4.1 `pnpm -F @loom-js/loom type-check` — no new errors vs. baseline
- [x] 4.2 Browser sanity: docs topic navigation still fetches once and renders; re-visiting a topic serves from cache (no new network request)

## 5. Bookkeeping

- [x] 5.1 Confirm no changeset needed (`@loom-js/utils` private)
- [x] 5.2 `pnpm format` + `format:check` clean
