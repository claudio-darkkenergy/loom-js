# Tasks — activity-transform-concurrency

## 1. Red (TDD)

- [ ] 1.1 Concurrency specs with deferred-promise fixtures: out-of-order stale commit dropped (latest default); multi-commit within current run; settlement waits on superseded runs; ordered mode (parallel starts, commits flush 1-2-3 despite reverse resolution, rejection releases the turn), serial mode (fast second waits, predecessor-visible `value`, rejection releases queue); sync/untransformed unchanged — confirmed failing on today's behavior where applicable

## 2. Green

- [ ] 2.1 Dispatch-id supersession (D2) + ordered commit-buffer and serial queue (D3), behind the `concurrency` enum (D4) in `activity.ts`; dropped-commit debug line (activity scope); settle option naming (D4) against the specs
- [ ] 2.2 Full suite + `type-check`/`type-check-tests` green; bundle delta noted

## 3. Docs & release

- [ ] 3.1 README Transforms + Options (incl. the when-to-use guide) per D5; activities topic mirrored and draft re-pushed; map sample note if outlines shift
- [ ] 3.2 **Minor** changeset with the behavior-change note (nondeterministic race → latest-wins)
- [ ] 3.3 One-line note in `server-first-loom-app` tasks that prerender verification assumes these semantics
