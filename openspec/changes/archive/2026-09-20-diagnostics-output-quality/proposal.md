# Diagnostics Output Quality

## Why

Loom's console contract is sound (always-on warnings, opt-in scoped narration, real call-site attribution, collapsed hot paths) but the _output itself_ underdelivers: messages are unstyled prose with no visual identity, narration lines don't say which activity/component they concern (activities are anonymous — a page of `[loom]` lines from three activities is untraceable), and warnings state problems without pointing at fixes. Recent proposals keep adding diagnostics (dropped-commit notices, timeout expiries, long-pending notices, memo overruns) with no shared format to land in (maintainer request, 2026-09-07: maximize console value — readability, traceability, fastest path to the detail that matters).

## What Changes

- **A diagnostics style contract**: every loom console line carries a consistent, scannable shape — the `[loom]` badge, its scope/lane tag, the _subject_ (which activity, element, or template), the event, and the detail — with `%c` styling in browsers that support it and clean plain-text fallback (server consoles included).
- **Subjects get names**: `activity(initial, { label })` (and equivalents where diagnostics reference other subjects) — opt-in labels that narration, warnings, and the pending-count diagnostics use; unlabeled subjects fall back to a stable generated tag so lines are still distinguishable.
- **Warnings point at the fix**: each always-on warning names the remedy or the docs concept in one trailing clause (the diagnostics topic's vocabulary), not just the symptom.
- **The pending diagnostics get first-class output**: `maxWait`-class expiries enumerate _which_ labeled subjects are still pending, not just a count.
- In-flight diagnostics (concurrency's dropped-commit/timeout/long-pending, instance-state's overrun) adopt the contract as they land — coordinated, not duplicated.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `diagnostic-logging`: gains the output-shape requirement (consistent line anatomy, subject identification, remedy-bearing warnings, labeled pending enumeration) alongside the existing surface/attribution/collapse requirements.

## Impact

- `packages/core/src/lib/globals/loom-console.ts` + call sites across `activity`, templating, settlement; `ActivityOptions.label` (and the type surface).
- Attribution constraint honored: styling must not break the existing call-site attribution requirement (bound native methods — the formatter composes arguments, never wraps the method).
- README diagnostics section + topic 13; **minor** core changeset. Coordinates with `activity-transform-concurrency` and `component-instance-state` (their notices adopt the format).
