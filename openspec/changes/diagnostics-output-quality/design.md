# Design — diagnostics-output-quality

## Context

`loom.console` returns bound native methods (attribution requirement — no wrappers), gated at property access; scopes: activity/creation/mutations/updates; hot paths collapse into groups. Messages today are ad-hoc strings. Activities/subjects are anonymous, so narration and pending counts can't be traced to their source. Several in-flight proposals each mint new diagnostic lines.

## Goals / Non-Goals

**Goals:** one line anatomy every diagnostic uses; subjects identifiable; warnings actionable; zero cost when gates are closed; attribution preserved.

**Non-Goals:** a devtools extension or structured-logging transport (console only); mandatory labels (opt-in + generated fallback); changing what is warned about (format, not policy); log levels beyond the existing lanes.

## Decisions

### D1 — Line anatomy: badge · scope · subject · event · detail

`[loom] activity ⟨search⟩ dropped commit — superseded by dispatch 4` — composable as arguments (not one concatenated string) so `%c` styles the badge/scope/subject segments in browsers and degrades to plain segments in server consoles (capability-sniffed once). The formatter builds the argument array; the _call_ stays a bound native method, preserving attribution.

### D2 — Subject labels: opt-in, with stable generated fallbacks

`ActivityOptions.label?: string`; diagnostics referencing an unlabeled subject use a stable per-instance tag (`activity#3` in creation order per window). Labels feed narration, dropped-commit/timeout notices, and the pending enumeration. Other subject kinds (templates, elements) reuse what identifies them already (tag names, element names); labels never affect behavior.

### D3 — Pending enumeration

The settlement diagnostics keep the count but add the labeled subjects still pending (up to a cap), turning "3 pending" into "3 pending — ⟨page-content⟩, ⟨search⟩, activity#7". Requires the settlement tracker to note subjects at track time — bounded extra bookkeeping, debug-lane-priced (subjects recorded only when narration or a bound could report them — design the gate so production hot paths pay nothing when everything is off... except always-on maxWait warnings need it; keep the record cheap: a label ref per pending entry).

### D4 — Remedy clauses

Every always-on warning ends with the one-line fix or concept pointer ("— pass `{ scroll: false }`…", "— see Dehydrated state: serializability boundary"). Text-only; no URLs (docs anchors churn; concept names don't).

## Risks / Trade-offs

- [Styling breaks attribution] → the attribution requirement stays specced; the formatter only builds arguments.
- [Label bookkeeping on hot paths] → labels are stored references; generated tags are lazy; measured before/after in the change.
- [Format drift as future diagnostics land] → the contract lives in the spec; in-flight proposals reference it by name.

## Migration Plan

Minor core release; message-text changes are not API. In-flight diagnostic proposals adopt the anatomy at their own apply.

## Open Questions

None — segment glyphs/wording settle at red-spec review against real console output.
