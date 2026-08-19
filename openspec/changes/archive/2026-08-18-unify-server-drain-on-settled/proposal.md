## Why

`renderToString`'s drain is still the pre-settlement heuristic: poll `body.innerHTML` each macrotask, stop when two consecutive passes match (or after 10 passes). It under-waits real async data — a transform awaiting a fetch that takes longer than one macrotask hop leaves the markup unchanged between passes, so the drain declares quiet and serializes the fallback — and over-waits synchronous apps by at least one full pass of markup serialization. `add-client-hydration` (2026-08-16) built the real signal (`settled()`, the per-window pending-transform counter) and explicitly deferred unifying the server drain onto it; nothing has picked that up since.

## What Changes

- `renderToString` waits on the settlement signal (`whenSettled`, the same counter `settled()` and `hydrate` consume) instead of polling for markup quiet. Slow-but-tracked async work (async activity transforms, route/page imports, `lazyImport`) serializes fully regardless of how many macrotasks it spans; arbitrary-depth chains settle without a fixed pass budget.
- The wait is bounded by a new `maxWait` option on `RenderToStringOptions` (symmetric with `hydrate`'s `maxWait`): on expiry the render serializes what has landed and warns with the pending count; `Infinity` disables the bound. This preserves the old drain's give-up-and-serialize behavior for never-settling work.
- `MAX_DRAIN_PASSES` and the markup-comparison loop are removed from `server.ts`.
- Not breaking: `renderToString`'s signature and resolved value are unchanged; only the settle policy tightens (more-complete markup, never less).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `server-rendering`: the async render's settle policy changes from "drain until the markup goes quiet (bounded by fixed passes)" to "await the settlement signal (bounded by `maxWait`)". The route-aware rendering scenario and the `renderToString` entry description both state the drain contract, so this is a spec-level change.

## Impact

- `packages/core/src/server.ts` — `renderSettled` rewires onto the settlement signal; `RenderToStringOptions` gains `maxWait`.
- `packages/core/src/hydrate.ts` — its private `boundedWait` helper becomes shared with the server path (extraction, no behavior change).
- `packages/core/tests/server/` — route-rendering and dehydrate tests exercise the drain; the `pending:stuck` dehydrate fixture documents the never-settles case and now runs against `maxWait`.
- No new dependencies; no client-path changes.
