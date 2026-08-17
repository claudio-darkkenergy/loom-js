# add-dehydrated-state — proposal

## Why

Settle-and-swap hydration (landed in `add-client-hydration`) is correct but pays for its data twice: the server ran the app's fetches to produce the markup, and the hydrating client re-runs the same fetches to rebuild the same state — the swap waits on them, and duplicate fetches dominate the double-render cost the design accepted. Dehydration closes that gap: serialize the server's fetched results into the page and prime the client from them, so hydration settles from local data instead of the network.

## What Changes

- **A keyed resource cache primitive in core** (working name `resource(key, fetcher)`, in the `lazyImport` mold): memoizes async results per key, per window through the DOM provider seam. Fetches routed through it are the interception point dehydration needs — core stays fetch-agnostic and zero-dep; the fetcher is app code.
- **Server-side capture**: after a render settles, the server consumer collects the window's settled resource values as a JSON-serializable state object (a sibling export in `@loom-js/core/server` — `renderToString`'s contract is untouched).
- **Client-side priming**: a boot-time prime step seeds the browser window's resource cache from that state object before the app renders, so the same `resource(key, fetcher)` call resolves from cache without invoking the fetcher. Works ahead of any boot — `hydrate` _and_ `init` — with no change to either's contract.
- **Explicit transport, no page magic** (explicit user pick): state travels as a value the consumer embeds and reads back themselves — a script-tag convention is documented (with safe-embedding guidance), but loom never writes or discovers page structure.
- **Out of scope:** automatic script-tag embed/discovery (possible future convenience layer); dehydrating raw activity values (the resource cache is the seam); cache invalidation/TTL semantics beyond the boot-time prime.

## Capabilities

### New Capabilities

- `dehydrated-state`: the server-to-client state handoff for pre-rendered pages — a per-window keyed resource cache, dehydration of its settled values after a server render, and boot-time priming on the client so primed fetches never hit the network.

### Modified Capabilities

<!-- none — server-rendering requirements are unchanged (capture is a sibling export); client-hydration requirements are unchanged (priming happens before boot, hydrate's contract is untouched — the settled signal simply resolves sooner because primed transforms do no network work) -->

## Impact

- `packages/core/src`: new resource-cache module (public primitive + prime step) with per-window state in `lib/` (settlement/Router precedent); a dehydrate export added to `server.ts`. Zero runtime dependencies preserved; tree-shakeable and byte-budgeted like `hydrate`.
- `packages/core/tests`: new specs (TDD per repo workflow) — cache semantics, dehydrate/prime round-trip, per-window isolation, and an end-to-end proof that a primed hydration issues no fetcher calls.
- `packages/core/README.md`: dehydration section extending the `renderToString` → `hydrate` story; script-tag embedding convention and serializability boundary documented.
- No app changes required — `apps/loom` adopts in its own later change.
- Changeset: `@loom-js/core` minor.
