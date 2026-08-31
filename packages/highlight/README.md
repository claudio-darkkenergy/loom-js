# @loom-js/highlight

Syntax highlighting for loom UI libraries, with the tokenizer inverted out of the UI layer: a UI library renders tokens; this package produces them.

- `codeTokenizer()` — a `lazyImport` activity resolving to `Tokenize`: `(text, language) => CodeToken[]`. Prism core and the registered grammars (TypeScript, Bash, HTML/markup) load on first use through sequential dynamic imports, so bundler code splitting can't reorder them, and the load is tracked by core's settlement signal (`renderToString` / `hydrate` wait for it).
- `tokenizeCode(prism, text, language)` — the pure, synchronous text→tokens step.
- `CodeTokenKind` — the canonical token vocabulary UI libraries theme against (`comment`, `keyword`, `string`, `number`, `function`, `class-name`, `property`, `tag`, `attr-name`, `attr-value`, `punctuation`, `operator`, `variable`, `constant`, `regex`, `plain`).
- `resolveLanguage(alias)` — `ts`→`typescript`, `sh`/`shell`→`bash`, `html`/`xml`/`svg`→`markup`; unknown languages tokenize as one `plain` run.

```ts
import { codeTokenizer } from '@loom-js/highlight';
import { PinkCodePanel } from '@loom-js/pink';

PinkCodePanel.Content({
    children: source,
    language: 'ts',
    tokenize: codeTokenizer()
});
```
