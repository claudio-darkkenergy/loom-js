---
'@loom-js/highlight': minor
---

Initial release: syntax highlighting inverted out of the UI layer. `codeTokenizer()` is a `lazyImport` activity resolving to a pure `Tokenize` (`(text, language) => CodeToken[]`) over Prism core + TypeScript/Bash/HTML grammars, loaded on first use through sequential dynamic imports (bundler-splitting-safe) and tracked by core's settlement signal. Exports the canonical `CodeTokenKind` vocabulary UI libraries theme against, `tokenizeCode`, and `resolveLanguage` (aliases `ts`, `sh`/`shell`, `html`/`xml`/`svg`).
