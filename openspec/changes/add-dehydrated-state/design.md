# add-dehydrated-state — design

## Context

`add-client-hydration` made the pre-rendered boot invisible but left its cost note standing: the client re-runs every fetch the server already ran, and the swap waits on them. Core has no fetch layer to intercept — fetches are app code inside async activity transforms — so dehydration needs a seam core _can_ own. Strategy was settled during proposal (explicit user picks): a **keyed resource cache** as the priming seam, and **explicit transport** (the consumer embeds and reads back the state; loom never touches page structure).

The machinery this builds on already exists: per-window state through the DOM provider seam (Router, settlement counter), the `lazyImport` mold for a keyed async cache, and the settlement signal — a primed fetch that resolves from cache settles almost immediately, so `hydrate` gets faster with **zero new settlement wiring**.

Constraints: zero runtime dependencies; fetch-agnostic (the fetcher is app code); non-adopting apps pay no bytes (tree-shakeable, byte-budgeted like `hydrate`); per-window isolation; anything DOM-shaped resolves through `getWindow`/`getDocument`; `noUncheckedIndexedAccess`-strict TS.

## Goals / Non-Goals

**Goals:**

- A core primitive apps route fetches through: keyed, per-window, memoizing — the single interception point for capture and priming.
- Server-side capture of a render's settled resource values as a JSON-safe object, without changing `renderToString`'s contract.
- Client-side boot-time priming so primed keys never invoke their fetcher — ahead of `hydrate` _or_ `init`.
- Safe embedding: a serialize helper that makes the script-tag convention XSS-safe by construction.
- Graceful degradation everywhere: a missing/unserializable/failed entry is just a cache miss — the client fetches as it does today.

**Non-Goals:**

- No automatic script-tag embed/discovery (future convenience layer; noted in proposal).
- No dehydration of raw activity values — the resource cache is the seam (proposal decision).
- No TTL/invalidation/revalidation semantics — the cache is a window-lifetime memo like `lazyImport`; freshness is expressed through keys.
- No fetch implementation, retries, or dedupe policy beyond per-key memoization.

## Decisions

### D1 — `resource(key, fetcher)`: a per-window keyed async memo, not an activity

`resource(key: string, fetcher: () => Promise<T>): Promise<T>`. First call per key (per window) invokes the fetcher and caches the in-flight promise — concurrent callers share it; on resolution the settled value is recorded (that record is what dehydration reads). Called inside an async activity transform (the idiomatic data path), the returned promise is already tracked by the settlement counter — primed hydration settles fast for free.

A promise-returning function, not an activity: this is a cache, not a reactive value — it composes _inside_ transforms rather than replacing them, and it avoids the identity/staleness hazards that sank the activity-snapshot alternative (module-level activities are shared across renders; seeding a value doesn't stop a transform from re-fetching).

**Rejections are not cached** — a failed fetch rejects every caller sharing the in-flight promise, then evicts, so a later call retries. Errors must never be dehydrated into a page.

Cache state is per-window (`WeakMap` keyed by the provider window — settlement precedent), so concurrent server renders cannot cross-talk and a render's cache is garbage-collected with its window. `resource` requires a resolvable window (same actionable throw as the rest of the render path); call it inside transforms/components, not at module scope.

### D2 — Capture: `dehydrate(window)` as a sibling export in `@loom-js/core/server`

After `await renderToString(app, { window, url })`, the consumer calls `dehydrate(window)` and gets a plain `{ [key]: value }` of that window's **settled** resource values. Pending entries (possible when `maxWait`-style drain bounds expire) are skipped. Each entry is checked serializable (`JSON.stringify` in a try/catch); unserializable entries are skipped with a debug-gated `loomConsole` warning — on the client that key is a cache miss, so the page still works, it just fetches.

Sibling export, not a `renderToString` return-shape change: non-breaking, explicit, and keeps the server-rendering capability's requirements untouched.

### D3 — Priming: a standalone boot-time step, not a `hydrate` option

A core export (working name `primeResources(state)`) seeds the **current window's** cache: each key resolves without ever invoking its fetcher. It must run before the boot call renders the app (transforms run during first render) — documented ordering, same line of code either way:

```ts
primeResources(readEmbeddedState());
hydrate({ app: App(), root });
```

Standalone rather than `hydrate({ state })` because priming is boot-agnostic — an `init`-booted page benefits identically (no duplicate fetches, even where a flash is acceptable) — and it keeps `hydrate`'s contract stable. A `state` sugar prop can layer on later without rework. Corollary: the `client-hydration` spec is untouched; its settled signal simply resolves sooner.

### D4 — Transport: explicit handoff + an XSS-safe serialize helper

The consumer embeds the state (documented convention: `<script type="application/json">` + `JSON.parse` on read) and passes it to the prime step. Core ships one helper in the server entry — a safe serializer that escapes the sequences that break out of a script element (`<` → `\u003c`, U+2028/U+2029) — because hand-rolling `JSON.stringify` into inline HTML is a known XSS footgun (`</script>` smuggled through content). The helper is the only concession; loom still never writes or discovers page structure.

### D5 — Lifetime: window-lifetime memo; freshness lives in the key

A cached or primed value persists for the window's lifetime, exactly like `lazyImport`'s cache — SPA navigation away and back reuses it. Consumers express freshness through keys (`page:${slug}`, include a content version if needed). Key collisions follow Map semantics (last write wins); a namespacing convention (`<domain>:<id>`) is documented. TTL/invalidation is explicitly future.

## Risks / Trade-offs

- **[Primed data staleness on long-cached pages]** → inherent to any dehydration; freshness is the consumer's call via keys/page cache headers; TTL noted as future work.
- **[Unserializable or missing entries]** → graceful by design: cache miss → client fetches; dehydrate warns (debug-gated) so the gap is visible in development.
- **[XSS via embedded state]** → the safe-serialize helper plus documented convention; never interpolate unescaped JSON into HTML.
- **[Key collisions across app modules]** → documented namespacing; last-write-wins is at least deterministic.
- **[Adoption cost: fetches must route through `resource`]** → the trade accepted when choosing the cache seam over activity snapshots; it is opt-in and incremental — unrouted fetches keep today's behavior exactly.
- **[Bytes]** → three small tree-shakeable exports plus a per-window `WeakMap`; measured against the change's budget at apply (hydrate precedent: entry 483 B gzip).

## Open Questions

- None blocking. Export names (`resource`, `primeResources`, `dehydrate`, the serialize helper) are finalize-at-apply against the public surface, per the `settled` precedent.
