# Design — activity-transform-concurrency

## Context

`update()` (activity.ts) calls the transform inline, handing it `{ input, update, value }`, and tracks a thenable return for `settled()`. Nothing relates one dispatch to another. The router's match transform is synchronous (unaffected); `lazyImport` dispatches once per cache key (unaffected); user data transforms — the documented idiomatic path — are fully exposed. The resource cache dedupes same-key fetches only; distinct keys race.

## Goals / Non-Goals

**Goals:** deterministic commit semantics for concurrent dispatches; the sync mental model ("value reflects the last `update()`") preserved by default; an ordered mode for accumulation; settlement correctness in both modes.

**Non-Goals:** cancellation of in-flight work (superseded runs complete; their commits are ignored — an abort seam is future work if fetch cancellation earns it); debouncing/throttling (caller-land); changing effect/watch notification order (FIFO per commit, as today).

## Decisions

### D1 — Latest-dispatch-wins is the default, not an option

Fetch-and-display is the overwhelming transform shape, and rapid re-dispatch means "the user changed their mind" — newest intent wins, one paint. The alternative default (sequenced) would _guarantee_ the stale paint the race only sometimes produces, and stacks queue latency under dispatch spam. Making latest opt-in instead would leave the documented idiomatic path nondeterministic by default — rejected outright (maintainer direction). Behavior-change note rides the changeset: any code relying on merge-y racing was relying on nondeterminism.

### D2 — Supersession mechanics: dispatch id, dead-run commits dropped

Each `update()` increments a dispatch counter; the `update` closure handed to that run captures its id, and commits check it against the latest — a superseded run's commits no-op. The run's promise remains settlement-tracked (SSR still waits; work isn't cancelled, just silenced). `reset()` is an ordinary dispatch. `value` handed at dispatch time is unchanged (point-in-time read, as documented).

### D3 — Sequenced mode serializes execution, not just commits

The opt-in queues dispatches FIFO: run N+1's transform is not invoked until run N settles (resolve or reject — a rejection releases the queue). Chosen over run-concurrently-buffer-commits because ordering alone isn't what accumulation needs — each run must _see_ its predecessor's committed `value` to append coherently; buffered commits would hand every run the same stale snapshot. Cost (latency stacking) is inherent to asking for order. Settlement counts queued dispatches from enqueue time, so `settled()`/`renderToString` drain the whole queue.

### D4 — Option surface

One option on `ActivityOptions`, tentatively `sequenced?: boolean` (default `false` = latest-wins), matching the existing plain-boolean style (`deep`, `force`). A string enum (`concurrency: 'latest' | 'sequenced'`) is the fallback if a third mode ever materializes — not pre-built.

### D5 — Docs carry the semantics as first-class Transforms material

The Transforms section states latest-wins explicitly ("a newer `update()` retires an in-flight run — its late commits are dropped"), the Options list gains the sequenced flag with the accumulation framing, and "call `update` as many times as needed" gets scoped to _within a run_. README + topic in the same change.

## Risks / Trade-offs

- [Silent behavior change for merge-racers] → changeset note; such code depended on timing nondeterminism, and the ordered modes are the deliberate replacements.
- [An ordered/serial queue never drains if a transform hangs] → same exposure `settled()` already has for any pending transform; bounded waits (`maxWait`) remain the framework-wide answer.
- [Dropped-commit debugging confusion] → a `loom.console` debug-lane line (activity scope) when a superseded run's commit is dropped.

## Migration Plan

Minor core release. Default-affected consumers: none known in-repo relying on merge racing; the docs app's `pageContent` race is _fixed_ by the default. Order-dependent users opt into `'ordered'` or `'serial'`.

## Open Questions

None.
