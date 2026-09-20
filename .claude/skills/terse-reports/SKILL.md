---
name: terse-reports
description: Diagram-first, hard-capped terse format for every plan, finding, report, and follow-up answer in this project. Use for all status/report-style responses.
---

**Plans, findings, and reports are diagram-first and terse.** Open with a
one-line "what" header stating outcome + subject (e.g. `**Implementation
Complete** — <change> — N/N tasks ✓`) so the reader knows what is being
reported before parsing the diagram. Then an ASCII flow chart or a single
pipeline line with one-word (or hyphenated) arrow labels showing what the
change does and where it sits; follow with one-line bullets (pieces, tests,
PR shape, points), then only the questions.
No paragraph-length rationale — park the reasoning and give it when asked.
The _work_ stays rigorous; only the _report_ gets short.

**Hard caps, not preferences.** One line per bullet. No bullet over ~25
words. No prose paragraph anywhere in a report, ever — if a thought needs a
paragraph, it is a detail the user will ask for. No section that restates
what a bullet above already said. A report the user has to scroll is a
failed report, however correct it is. This applies to follow-up answers and
corrections too, not just the first report: **every** reply stays short.
Give the conclusion; hold the derivation until asked. Example shapes:

```
cron tick ──publish──► sweep job ──select──► unlinked rows
                            │
                            ▼
                 existing linker (reused) ──► SF push ──► ingest
```

`callback 409s ──► identity miss ──► [NEW] provision ──► existing insert`
