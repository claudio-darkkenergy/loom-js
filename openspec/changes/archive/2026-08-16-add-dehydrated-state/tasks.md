# add-dehydrated-state — tasks

## 1. The resource cache (the seam)

- [x] 1.1 TDD: `resource(key, fetcher)` memoization — one fetch per key, concurrent callers share the in-flight promise, later calls resolve from cache; per-window isolation via the provider seam (spec: "keyed resource cache"; design D1). Finalize the export name against the public surface.
- [x] 1.2 TDD: rejection semantics — a failed fetch rejects sharing callers, is evicted (not cached, never dehydrated), and a subsequent call retries (spec: "Rejection is retryable"; design D1).

## 2. Dehydrate (server entry)

- [x] 2.1 TDD: `dehydrate(window)` sibling export — returns the window's settled resource values as a plain object surviving a `JSON.stringify`/`parse` round-trip; `renderToString` contract untouched (spec: "Settled values round-trip"; design D2). Node server lane.
- [x] 2.2 TDD: degradation — pending entries skipped; unserializable values skipped with a debug-gated `loomConsole` warning while remaining entries survive (spec: "Unserializable entries degrade to a miss"; design D2).

## 3. Priming (client boot)

- [x] 3.1 TDD: prime step seeds the current window's cache — primed keys resolve without invoking the fetcher; unprimed keys fetch exactly as before; ordering ahead of `hydrate`/`init` documented (spec: "Priming seeds the client cache"; design D3).
- [x] 3.2 End-to-end proof: `renderToString` an app whose transform loads through `resource` → `dehydrate` → serialize/parse round-trip → prime → `hydrate` in a browser test → assert zero fetcher invocations client-side and the final DOM matches the served markup (spec: "Primed hydration settles without fetching").

## 4. Script-safe serialization

- [x] 4.1 TDD: serialize helper — `<`, U+2028, U+2029 escaped; `</script>`-carrying values neutralized; `JSON.parse` reproduces the original state (spec: "Embeddable serialization is script-safe"; design D4).

## 5. Budget & integration

- [x] 5.1 Measure the byte cost: resource/prime tree-shaken out of non-adopting bundles (verify), dehydrate/serialize confined to the server entry; record against the change's budget in the design findings.
- [x] 5.2 `pnpm -F @loom-js/core type-check` + `type-check-tests` + full `test-ci` green.

## 6. Docs & release

- [x] 6.1 `packages/core/README.md`: dehydration section extending the pre-rendering story (`renderToString` → `dehydrate` → embed → prime → `hydrate`); document the script-tag convention with the safe serializer, key namespacing (`<domain>:<id>`), the serializability boundary, and window-lifetime cache semantics (design D4, D5).
- [x] 6.2 Changeset: `@loom-js/core` minor. Update `.claude/skills/skill-config.md` for the new public API (resource cache, prime, dehydrate, serialize helper).
