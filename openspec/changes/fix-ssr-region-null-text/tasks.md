# Tasks — fix-ssr-region-null-text

## 1. Red

- [ ] 1.1 Server tests rendering the browser suites' children/slot fixtures via `renderToString`, asserting parity with their pinned markup — confirmed failing on the leading `null`

## 2. Diagnose & fix

- [ ] 2.1 Root-cause per design D1 (node-level browser-vs-server diff of a compiled region; test the fragment-prefix/values suspicion first); record the cause in this change
- [ ] 2.2 Fix at the seam the diagnosis supports; full browser suite + server tests green; `type-check`/`type-check-tests`

## 3. Release

- [ ] 3.1 **Patch** changeset for `@loom-js/core`; note the parity guarantee in the changeset body
- [ ] 3.2 Note in `server-first-loom-app` that its prerender verification depends on this landing (one line in its tasks)
