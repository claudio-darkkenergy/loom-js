---
'@loom-js/core': minor
---

Diagnostics style contract: every loom console line now composes one scannable anatomy — the `[loom]` badge, the scope/lane tag, the subject, the event, and the detail — `%c`-styled in browsers that support it, the same segments as plain text in server consoles. Styling composes arguments for the bound native console methods, so call-site attribution is unchanged.

- `ActivityOptions.label?: string` names an activity in diagnostics (`⟨search⟩`) — narration lines, dropped-commit and timeout notices, and the pending enumeration all use it. Purely diagnostic, never behavioral; unlabeled activities fall back to a stable generated tag (`activity#3`).
- Every always-on warning now ends with a one-clause remedy or docs-concept pointer, not just the symptom.
- Bounded settlement warnings (`hydrate` / `renderToString` `maxWait` expiries) enumerate the labeled subjects still pending alongside the count — `3 pending — ⟨page-content⟩, ⟨search⟩, activity#7` — capped at 5 with the overflow counted.
- Message text changes only — no API or behavior changes beyond the new `label` option.
