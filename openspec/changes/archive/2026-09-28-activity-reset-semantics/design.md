# Design — activity-reset-semantics

## Context

As proposed (2026-09-07), `reset: () => update(initialValue)` resolved to the public dispatcher, sending the `V`-typed initial value through a transform expecting `I`. `activity-transform-concurrency` (archived 2026-09-10) landed first and rewrote `reset` along the way: it no longer invokes the transform, and on a transformed activity it dispatches through the concurrency lanes. The internal committer is now the value store's `commit`, so the shadowing `update` name is gone too. `initialValue` is frozen at creation, so the baseline itself can't drift.

What this change still owes: a spec for the shipped behavior, the tests that pin it, a docs check, and a changeset that announces it.

## Goals / Non-Goals

**Goals:** reset is a return to baseline — transform never runs, types are sound, subscribers notified under the usual comparison, and a stale in-flight run can't land on top of it.

**Non-Goals:** a "re-dispatch initial input" affordance (that's `update(...)` at the call site); changing dispatcher, comparison, or freeze behavior; any code change to `reset`.

## Decisions

### D1 — Reset bypasses the transform

Creation already establishes "the initial value is stored untransformed" — reset returning to _that_ state is the only self-consistent reading; a reset that can fetch, suspend, or commit non-baseline values isn't a reset. The comparison pipeline (`shouldUpdate`, `deep`, shallow-clone on change) is unchanged, so a reset to an already-baseline value stays a no-op for subscribers.

### D2 — Reset dispatches as a run on transformed activities

Supersedes the original "commits, never dispatches" decision. A direct commit is synchronous, but under `'latest'` an in-flight run would still commit afterwards and overwrite the reset. Dispatching the reset as a run (whose body is a synchronous commit) gives it the same guarantees as any dispatch: it retires the in-flight run under `'latest'`, keeps dispatch order under `'ordered'`, and queues under `'serial'`. With nothing in flight it commits synchronously and tracks nothing. Untransformed activities have no lanes and commit directly.

Rejected: retire every in-flight and queued run, then commit directly — synchronous and stale-safe, but it makes reset cancel work in the modes whose contract is that every dispatch lands.

### D3 — Announce with a patch changeset

The behavior shipped in the concurrency release without a changelog line. No code changes here, so the changeset is a **patch** that documents the behavior and the `reset()` → `update(<initial input>)` migration.

## Risks / Trade-offs

- [Someone relied on reset re-running the transform] → the migration is mechanical (`reset()` → `update(<initial input>)`) and the changeset says so; the old behavior was only well-typed when `I = V`.
- [Reset isn't always synchronous] → under `'ordered'`/`'serial'` with a run in flight it lands in turn; documented in the README `reset()` entry.

## Migration Plan

Single release; no code change.

## Open Questions

None.
