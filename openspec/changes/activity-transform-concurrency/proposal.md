# Activity Transform Concurrency

## Why

`update()` on a transform-bearing activity dispatches the transform immediately and unconditionally: two rapid dispatches run concurrently, and the committed value is whichever run's inner `update(next)` lands last in real time — so an earlier dispatch resolving late overwrites newer data with stale data (found 2026-09-06 reviewing the Transforms docs; the docs app's per-navigation `pageContent.update` races exactly this way under rapid prev/next). The docs teach transforms as _the_ async-data path with no mention of this nondeterminism. Current behavior is kept by no one on purpose (maintainer: "do not leave it as it is, 100%").

## What Changes

- **Default becomes latest-dispatch-wins**: each `update()` supersedes prior in-flight dispatches — a superseded run's later commits are dropped (its promise stays settlement-tracked). Multi-commit transforms (loading → data) still commit freely _within_ the current run. This extends the sync path's existing guarantee — the value reflects the last `update()` — to async.
- **Two opt-in ordered modes** (`ActivityOptions.concurrency`): **`'ordered'`** — dispatches run in parallel for speed, but commits apply strictly in dispatch order (independent work whose arrival order matters: graph points, chart streams); **`'serial'`** — a dispatch's transform does not start until the prior settles, so each run's `value` context sees its predecessor's committed result (accumulation via `value`: running totals, ledgers).
- **Cooperative cancellation rides supersession**: the transform context gains `signal` (an `AbortSignal`), aborted when the run is superseded under `'latest'` — a transform that wires it into its work (`fetch(url, { signal })`) stops the actual request, and the run settles immediately instead of holding `settled()` open as a zombie. Ignoring the signal remains safe: late commits are dropped regardless.
- **`timeout?: number`** (`ActivityOptions`, no default): bounds each run — on expiry the run is retired exactly as supersession retires it (signal aborted, future commits dropped, queue/turn released) and it counts as settled even if its promise never resolves, so a hung transform can no longer block a `'serial'`/`'ordered'` queue or pin the settlement count forever. Expiry warns on the always-on console lane, like `maxWait` expiries. No auto-timeout heuristics (rejected on principle — design D2b); instead, a debug-lane notice flags long-pending runs on activities that set none.
- Activities without a transform, and synchronous transforms, are unaffected (their commits are already ordered by call order).
- README + activities topic: Transforms and Options sections document all three semantics — including when to reach for each (per the standing propagation requirement).

## Capabilities

### New Capabilities

- `activity-transform-concurrency`: dispatch semantics for async transforms — latest-wins supersession (default), ordered-commit and serial queuing (opt-in), settlement interaction, and the sync-path invariants both modes preserve.

### Modified Capabilities

_None._

## Impact

- `packages/core/src/activity.ts` — dispatch bookkeeping around the transform call and the per-run `update` closure.
- `packages/core/tests/unit` — new concurrency specs (deferred-promise fixtures forcing out-of-order resolution).
- `packages/core/README.md` + `contentful-sync/topics/07-activities.md` — semantics documented; drafts re-pushed.
- Published: `@loom-js/core` **minor** changeset; behavior note that the nondeterministic race is resolved to latest-wins.
- Sequencing: before `server-first-loom-app`'s verification leans on the data path; independent of everything else in flight.
