# Activity Reset Semantics

## Why

`reset()` is implemented as `update(initialValue)`, so on a transformed activity the initial value is dispatched _through the transform_ — asymmetric with creation (where the initial value is stored untransformed) and type-unsound when `I ≠ V`: the transform expects an `I` input but reset hands it the `V`-typed initial value, uncaught internally (e.g. an `activity<PageData | undefined, string>` resets by feeding `undefined` to a transform expecting a slug). A reset can thereby trigger a fetch, land asynchronously, or commit something other than the baseline — surfaced during the activities docs review (2026-09-07); maintainer direction: reset should restore the initial value directly, bypassing the transform.

## What Changes

- `reset()` commits the initial value directly — same change comparison (`shouldUpdate`, `deep`/`force` respected) & subscriber notification as any commit, but the transform is never invoked. Synchronous, deterministic, nothing for settlement to track.
- The transformed path stays one call away — a caller who wants a re-dispatch of the initial input simply calls `update(...)`; reset is no longer that.
- Docs: the `reset` bullets in README & the Activities topic drop "Shorthand for `update(initialValue)`" for "restores the starting value directly, bypassing any transform"; the creation-time sentence added 2026-09-07 ("the initial value doesn't take this path") now holds for reset too.
- **Behavior change** on transformed activities only (untransformed reset is unchanged — the public `update` falls through to a plain commit). Pre-1.0: **minor** changeset with a loud description.

## Capabilities

### New Capabilities

- `activity-reset-semantics`: reset restores the frozen initial value without transform involvement, under normal change comparison & notification.

### Modified Capabilities

_None._

## Impact

- `packages/core/src/activity.ts` — `reset` targets the internal commit, not the public dispatcher (also erases the `V`-into-`I` type hole).
- `packages/core/tests` activity specs (TDD); README + topic 07 re-push; **minor** core changeset.
- `activity-transform-concurrency` note: a bypassing reset never enters the concurrency lanes — one line in that design when either lands second.
