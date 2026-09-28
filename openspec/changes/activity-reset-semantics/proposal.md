# Activity Reset Semantics

## Why

`reset()` is implemented as `update(initialValue)`, so on a transformed activity the initial value is dispatched _through the transform_ — asymmetric with creation (where the initial value is stored untransformed) and type-unsound when `I ≠ V`: the transform expects an `I` input but reset hands it the `V`-typed initial value, uncaught internally (e.g. an `activity<PageData | undefined, string>` resets by feeding `undefined` to a transform expecting a slug). A reset can thereby trigger a fetch, land asynchronously, or commit something other than the baseline — surfaced during the activities docs review (2026-09-07); maintainer direction: reset should restore the initial value directly, bypassing the transform.

## Status (2026-09-27)

`activity-transform-concurrency` landed first and changed `reset` itself: the transform is bypassed, and on a transformed activity the reset dispatches as a run through the concurrency lanes. That behavior is kept. This change no longer touches `reset` — it specifies the shipped behavior, adds the missing tests, checks the docs, and announces it in a changeset.

## What Changes

- `reset()` commits the initial value without invoking the transform — same change comparison (`shouldUpdate`, `deep`/`force` respected) & subscriber notification as any commit.
- On a transformed activity the reset dispatches as a run, so an in-flight transform can't land stale data on top of it: it retires the in-flight run under `'latest'`, keeps dispatch order under `'ordered'`, and queues under `'serial'`. With nothing in flight it is synchronous and adds nothing for settlement to track.
- The transformed path stays one call away — a caller who wants a re-dispatch of the initial input simply calls `update(...)`; reset is no longer that.
- Docs: the `reset` bullets in README & the Activities topic describe the bypass and the run dispatch; the creation-time sentence added 2026-09-07 ("the initial value doesn't take this path") holds for reset too.
- **Behavior change** on transformed activities only, already shipped with the concurrency release but never announced: **patch** changeset documenting it.

## Capabilities

### New Capabilities

- `activity-reset-semantics`: reset restores the frozen initial value without transform involvement, under normal change comparison & notification, dispatched as a run on transformed activities.

### Modified Capabilities

_None._

## Impact

- `packages/core/src/activity.ts` — no change; the shipped `reset` already bypasses the transform (which also erased the `V`-into-`I` type hole).
- `packages/core/tests` activity specs; README + topic 07 check; **patch** core changeset.
