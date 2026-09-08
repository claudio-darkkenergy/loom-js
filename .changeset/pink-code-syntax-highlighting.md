---
'@loom-js/pink': minor
---

Add themed syntax highlighting to `PinkCodePanel.Content` without a tokenizer dependency: `language` plus a `tokenize` lazy-import activity (e.g. `@loom-js/highlight`'s `codeTokenizer()`) render each line as `code-token` spans classed by kind, colored through the `--p-code-token-<kind>` variables in the new `@loom-js/pink/styles/code-tokens.css` (Ayu Dark preset with brand-tinted keyword/constant kinds; an AA-safe light counterpart). Lines render plain until the tokenizer lands; server renders and hydration wait for it. Panels without `language`/`tokenize` are unchanged. The theme file also anchors the dark panel background that upstream pink 1.0 leaves undefined.
