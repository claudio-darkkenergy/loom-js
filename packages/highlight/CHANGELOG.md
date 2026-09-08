# @loom-js/highlight

## 0.1.0

### Minor Changes

- 976b5b3: Initial release: syntax highlighting inverted out of the UI layer. `codeTokenizer()` is a `lazyImport` activity resolving to a pure `Tokenize` (`(text, language) => CodeToken[]`) over Prism core + TypeScript/Bash/HTML grammars, loaded on first use through sequential dynamic imports (bundler-splitting-safe) and tracked by core's settlement signal. Exports the canonical `CodeTokenKind` vocabulary UI libraries theme against, `tokenizeCode`, and `resolveLanguage` (aliases `ts`, `sh`/`shell`, `html`/`xml`/`svg`).

### Patch Changes

- 4a43f75: HTML comments inside template literals (`<!-- … -->` in an `html`-tagged template) tokenize as `comment` instead of inheriting the template string's kind, so annotations render in comment styling.
