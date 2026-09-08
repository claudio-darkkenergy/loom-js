# Design — activity-reset-semantics

## Context

Inside `activity()`, two `update`s exist: the internal committer (`(valueInput: V) => { valueProp.value = valueInput }`) and the returned dispatcher (`update(valueInput: I)`), which routes through the transform when one is set. `reset: () => update(initialValue)` resolves to the _dispatcher_, producing the transform trip and the `V`-as-`I` hole. `initialValue` is frozen at creation, so the baseline itself can't drift.

## Goals / Non-Goals

**Goals:** reset is a synchronous return to baseline — transform never runs, types are sound, subscribers notified under the usual comparison.

**Non-Goals:** a "re-dispatch initial input" affordance (that's `update(...)` at the call site); changing dispatcher, comparison, or freeze behavior in any other way.

## Decisions

### D1 — Reset commits, never dispatches

`reset: () => commit(initialValue)` (the internal committer, renamed from its shadowing `update` name for clarity). Rationale over the transform-trip alternative: creation already establishes "the initial value is stored untransformed" — reset returning to _that_ state is the only self-consistent reading; a reset that can fetch, suspend, or commit non-baseline values isn't a reset. The comparison pipeline (`shouldUpdate`, `deep`, shallow-clone on change) is unchanged, so a reset to an already-baseline value stays a no-op for subscribers.

### D2 — Ship as minor with a loud changeset

Only transformed activities observe the change, and the old behavior was type-unsound; per repo pre-1.0 convention this is a **minor** changeset whose description names the behavior change explicitly.

## Risks / Trade-offs

- [Someone relied on reset re-running the transform] → the migration is mechanical (`reset()` → `update(<initial input>)`) and the changeset says so; the old behavior was only well-typed when `I = V`.

## Migration Plan

Single release; docs land in the same change. If `activity-transform-concurrency` is in flight, add its one-line note (reset never enters the lanes).

## Open Questions

None.
