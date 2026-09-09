# Tasks — activity-transform-concurrency

## 1. Red (TDD)

- [ ] 1.1 Concurrency specs with deferred-promise fixtures: out-of-order stale commit dropped (latest default); multi-commit within current run; settlement waits on superseded runs; ordered mode (parallel starts, commits flush 1-2-3 despite reverse resolution, rejection releases the turn), serial mode (fast second waits, predecessor-visible `value`, rejection releases queue); signal aborted on supersession (wired fetch settles fast; ignored signal still safe; no fire in ordered modes); timeout retirement (hung serial run releases the queue + settlement via raced tracking; expiry aborts the signal; unset = unbounded; always-on warn); sync/untransformed unchanged — confirmed failing on today's behavior where applicable

## 1b. Types

- [ ] 1b.1 `ActivityTransform` context: `input: Readonly<I>` (D2c); fix any in-repo transform the stricter type flags; type-check-tests cover the mutation rejection

## 2. Green

- [ ] 2.1 Dispatch-id supersession + per-dispatch AbortController (D2) + ordered commit-buffer and serial queue (D3), behind the `concurrency` enum (D4), plus `timeout` retirement with raced settlement tracking and the debug-lane long-pending notice (D2b) in `activity.ts`; dropped-commit debug line (activity scope)
- [ ] 2.2 Full suite + `type-check`/`type-check-tests` green; bundle delta noted

## 3. Docs & release

- [ ] 3.1 README Transforms + Options (incl. the when-to-use guide) per D5; `input` bullet gains the by-reference read-only convention (D2c); activities topic mirrored and draft re-pushed; map sample note if outlines shift
- [ ] 3.2 **Minor** changeset with the behavior-change note (nondeterministic race → latest-wins)
- [ ] 3.3 One-line note in `server-first-loom-app` tasks that prerender verification assumes these semantics
- [ ] 3.4 Verify against the docs-app repro (2026-09-09): two rapid side-nav clicks before the first topic's fetch resolves — with `pageContent` on latest-wins, the first topic's content never flashes in; the skeleton holds until the second's data commits (an app-level supersede guard was drafted and deliberately reverted in favor of this landing)
