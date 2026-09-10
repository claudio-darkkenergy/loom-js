# Design — settlement-scroll-restoration

## Context

`consumePendingScroll` already models "a scroll owed once content exists": fragments wait on `boundedWait(settled(), 4000)`, top scrolls fire instantly. Restoration is a third owed-scroll kind with the fragment's timing and the browser's data. `history.state` survives reload and traversal per entry, which makes it the natural offset store; the router already pushes/replaces state on navigation.

## Goals / Non-Goals

**Goals:** exact position after reload and back/forward on client-rendered pages; top when nothing is saved; zero change to the rest of the scroll contract; inert off-browser.

**Non-Goals:** scroll position persistence beyond the session history (no storage); per-element scroll containers (window only, like every existing scroll path); restoring focus.

## Decisions

### D1 — `{ restore: y }` joins the PendingScroll union

Boot (nav type `reload`/`back_forward`) and popstate set `pendingScroll = { restore: savedY }` when `history.state` carries an offset; fragment presence outranks it (a hash in the URL keeps fragment semantics). Replay shares the fragment path's `boundedWait(settled(), …)` — one timing model for every content-dependent scroll.

### D2 — Capture on the way out, not continuously

The offset is written into the entry's state via `replaceState` at the moments the entry is being left: before the router pushes the next entry, and on `pagehide`/`beforeunload` for reloads. Rationale: continuous scroll listeners are hot-path cost for data needed only at exit; capture-at-exit is exact and free.

### D3 — Manual restoration is set at router construction

The router already constructs lazily on first routing use in a DOM scope; that's early enough to beat Chrome's restoration attempt for client-rendered content (which waits on paint) and keeps the assignment out of module scope (off-DOM safety). The spec's "popstate left to the browser's own restoration" clause is superseded — the browser's own restoration is precisely what cannot work here.

## Risks / Trade-offs

- [Consumers reading `history.state` see the router's offset field] → namespaced key inside the state object; documented.
- [maxWait expiry replays against incomplete content] → same bounded-compromise as fragments: clamped again, but no worse than today's behavior, and loudly bounded.
- [Prerendered pages double-scroll (native paint position + replay)] → with manual restoration there is no native attempt; replay is the only scroll, and it fires immediately once settled (already-settled prerendered pages: effectively instant).

## Migration Plan

Minor core release; behavior change is the fix itself. Docs (README + Routing topic) update the traversal sentence in the same change.

## Open Questions

None.
