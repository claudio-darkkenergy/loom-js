# Tasks — fix-ssr-region-null-text

## 1. Red

- [x] 1.1 Server tests rendering the browser suites' children/slot fixtures via `renderToString`, asserting parity with their pinned markup — confirmed failing on the leading `null`

## 2. Diagnose & fix

- [x] 2.1 Root-cause per design D1 (node-level browser-vs-server diff of a compiled region; test the fragment-prefix/values suspicion first); record the cause in this change
- [x] 2.2 Fix at the seam the diagnosis supports; full browser suite + server tests green; `type-check`/`type-check-tests`

## 3. Release

- [x] 3.1 **Patch** changeset for `@loom-js/core`; note the parity guarantee in the changeset body
- [x] 3.2 Note in `server-first-loom-app` that its prerender verification depends on this landing (one line in its tasks) — that change had already archived (2026-09-15), so the note landed in its archived tasks as a post-archive record; shipped prerender output re-checked clean (leading template whitespace dodged the bug)
