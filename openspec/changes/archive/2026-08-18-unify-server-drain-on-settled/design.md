## Context

`renderSettled` (`packages/core/src/server.ts:185`) still waits for async content with the pre-settlement heuristic: up to `MAX_DRAIN_PASSES` (10) macrotask yields, exiting early when `body.innerHTML` is unchanged between two consecutive passes. Since `add-client-hydration` the framework has a real signal: every framework-mediated thenable (async activity transforms, route/page imports, `lazyImport`) is counted per window in `lib/settlement.ts`, exposed as `settled()`, and consumed by `hydrate` behind a `maxWait` bound. That change explicitly deferred rewiring the server drain onto the signal.

The heuristic is wrong in both directions. A transform awaiting real I/O (anything slower than one macrotask hop) leaves the markup unchanged between the first two passes, so the drain declares quiet and serializes the fallback — under-waiting exactly the content SSR exists to serialize. A fully synchronous app still pays a macrotask plus two full `innerHTML` serializations per pass — over-waiting the common case. And chains deeper than 10 passes truncate silently.

`renderSettled` already holds the injected window's async render scope open across `await` boundaries (`enterWindow`, serialized by `asyncRenderQueue`), so the settlement counter for the injected window is exactly what `settled()` resolves against when called inside the render.

## Goals / Non-Goals

**Goals:**

- The async server render serializes once framework-tracked async work has settled — event-driven, unbounded chain depth, no markup polling.
- A never-settling tracked thenable cannot hang an SSR request: the wait is bounded, and expiry serializes what has landed with a diagnostic warning (the old drain's give-up behavior, made explicit and tunable).
- One settlement contract across client and server: `hydrate` and `renderToString` gate on the same signal with the same bound semantics.

**Non-Goals:**

- No change to `renderToStringSync` — the synchronous contract (serialize what settled synchronously) stands.
- No new tracking coverage: async work that never passes through an activity transform (a bare `fetch` in a `watch` callback, `resource` called outside a transform) stays invisible to the signal, as documented for `hydrate`.
- No streaming/progressive rendering; the resolved value stays a single string.

## Decisions

**D1 — Gate on the public `settled()`, not a private reimplementation.** `renderSettled` replaces the polling loop with an awaited `settled()` (from `./settled`), captured while the render's window scope is open, then serializes `body.innerHTML`. The public signal already encodes the chain-handling the drain approximated (zero-crossing plus one macrotask of confirmed quiet — `whenSettled` in `lib/settlement.ts`), and consuming the exported surface keeps server and client on one spec'd contract. A synchronous app resolves after one macrotask — no slower than today's best case, minus the double serialization.

**D2 — Bound with `maxWait` on `RenderToStringOptions`, default `4000`, `Infinity` opt-out — symmetric with `hydrate`.** The old pass budget was an implicit bound; dropping all bounding would let one stuck fetch hang a request handler. Mirroring `hydrate`'s shape (same default, same escape hatch, same warning naming `getPendingCount()`) makes the bound one concept framework-wide. Rejected: keeping a pass count (still a heuristic), a distinct server default (nothing server-specific argues for one).

**D3 — Extract `hydrate`'s `boundedWait` into `lib/settlement.ts` and share it.** It is settlement-adjacent (a race between the settle gate and an expiry timer that cancels cleanly on either outcome) and needed verbatim by both consumers. Extraction only — `hydrate`'s observable behavior is unchanged.

**D4 — Warning on expiry goes through `loomConsole.warn`, matching `hydrate` exactly.** `[loom] renderToString: settlement did not complete within {maxWait}ms — serializing with N operation(s) still pending...`. `loomConsole` proxies `globalThis.console` behind the debug gate (`canDebug('console')`), which is the framework-wide warning policy — `hydrate`'s `maxWait` warning and `dehydrate`'s unserializable-value warning both use it. Rejected: an unconditional `console.warn` — it would make this the only ungated warning in core, and a server consumer that wants expiry diagnostics in request logs enables debug for the render.

## Risks / Trade-offs

- [Untracked async that mutated markup between polling passes used to be caught by accident; the signal ignores it] → This narrows behavior only for non-idiomatic apps (async work outside transforms). The idiom — async transforms, `resource` inside a transform — is tracked. Documented in the `renderToString` JSDoc alongside the existing `hydrate` note.
- [A stuck tracked thenable now waits the full `maxWait` (default 4s) where the old drain gave up after ~10 macrotasks] → That fast give-up was indistinguishable from the under-wait bug; callers with hard latency budgets set `maxWait` explicitly. The dehydrate `pending:stuck` test fixture keeps the never-settles case covered.
- [`settled()` resolution depends on the window scope being the injected window at call time] → Already guaranteed: `renderSettled` serializes concurrent renders and holds `enterWindow` open across awaits; `settled()` is called before any `await` inside that scope. A regression here is caught by the existing concurrent-render tests plus a new slow-transform test.
