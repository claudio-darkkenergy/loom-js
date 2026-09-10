# Settlement Scroll Restoration

## Why

Browser scroll restoration fires before a client-rendered page has content: Chrome clamps the saved offset against the skeleton-height document and never corrects. Measured on the production docs app (2026-09-09): reload from y=3200 lands at y=1636 — neither the saved position nor the top; shallow scrolls land visually "at the H1," which is how the bug was reported. Back/forward traversal has the identical clamp failure. The router already owns every other scroll of a navigation (fragment scrolls settlement-gated, top scrolls instant, `scroll: false` opt-out) — restoration is the one scroll still left to a browser that cannot get it right against async content.

## What Changes

- The router takes ownership of scroll restoration for its window: `history.scrollRestoration = 'manual'`, with the current offset captured into `history.state` on every router navigation and before unload.
- On reload and popstate traversal, the saved offset replays **after the settlement signal resolves** (bounded, mirroring fragment scrolls) — the content the offset referred to exists by scroll time, so the position is exact.
- No saved offset (fresh entry, cleared state) degrades to staying at the top — the boot position, untouched.
- The existing contract is unchanged elsewhere: instant top scroll on fragmentless route changes, settlement-gated fragment scrolls, `route(event, { scroll: false })`, and the router still never fights a scroll it doesn't owe.
- Server/off-DOM renders: inert, like every scroll path (runtime guards already in place).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spa-routing`: gains the restoration requirement — manual restoration ownership, offset capture per entry, settlement-gated exact replay on reload/traversal, top as the no-state fallback.

## Impact

- `packages/core/src/router.ts` (capture + replay in the pending-scroll machinery), `types.ts` if the state shape needs a type.
- Interaction to resolve at implementation: popstate currently "leaves restoration to the browser" per the spec — that clause inverts; the hash-navigation specs asserting it update in the same change.
- Tests (TDD, `packages/core/tests`), README routing section + Routing topic re-push, **minor** core changeset. Obsoleted for prerendered pages only in the sense that they don't need it — with `server-first-loom-app`, native restoration works, but manual replay stays correct there too (offset replays against already-present content immediately).
