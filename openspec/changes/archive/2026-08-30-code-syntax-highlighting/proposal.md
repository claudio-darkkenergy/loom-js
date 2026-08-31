# Code Syntax Highlighting

## Why

Every code sample on the docs site renders as a single-color monospace block. With the copy button, 2-space indent, and comment conventions in place, the remaining readability gap is structural: keywords, strings, comments, and template markup all read as the same weight, so the eye has nothing to anchor on in a 30-line sample. Themed syntax highlighting closes that gap, and doing it in the design system makes it available to every loom consumer that renders code, not just the docs app.

## What Changes

- `@loom-js/pink`'s `PinkCodePanel.Content` gains token-aware rendering: `language` plus a `tokenize` activity (inverted in from the app layer — pink takes no tokenizer dependency) render each code line as classed token spans instead of a plain text node. Without both, lines render exactly as today.
- A new published package, `@loom-js/highlight`, owns the tokenizer (Prism), grammar loading, and the canonical token vocabulary, so every loom UI library shares one adapter instead of each managing the dependency.
- Pink ships a **token theme** as CSS custom properties (`--p-code-token-<kind>`) on `.code-panel`, with one bundled preset. The preset is one of the maintainer's three candidates — **Vercel**, **Monokai Dimmed**, **Ayu Dark** — chosen in design; the token-variable layer keeps the others a CSS-only swap (or a consumer override) and carries a light-theme counterpart so the panel stays legible under `.theme-light`.
- Tokenization runs on the **same render path the server runs** — a pure text→tokens step, no DOM — so prerendered pages ship highlighted markup and hydration swaps to identical DOM (per `server-first-loom-app` / `client-hydration`).
- The docs app passes the `// @lang` label through as `language` (it already reaches `CodeSample`); the rich-text convention gains nothing new.
- Non-breaking: `PinkCodePanel.Content` with no `language` is byte-identical output.

## Capabilities

### New Capabilities

- `code-syntax-highlighting`: how a code panel turns source text into themed, classed tokens — language selection, the token-kind vocabulary and its CSS variable contract, fallback for unknown languages, render-path purity (server-safe), and the docs app's `@lang` pass-through.

### Modified Capabilities

_None — no existing spec's requirements change. `app-prerendering` / `client-hydration` remain satisfied by design (pure tokenization)._

## Impact

- `packages/highlight` — **new published package `@loom-js/highlight`**: the Prism adapter, grammar loader (`codeTokenizer()`), and canonical token vocabulary — shared by every loom UI library. Initial minor changeset.
- `packages/pink` — `PinkCodePanel.Content` (token rendering behind a `tokenize` activity + `language`), theme CSS, Storybook stories per language. **No new runtime dependency** — the tokenizer is inverted in from the app layer. **Minor** pink changeset.
- `apps/loom` — `styled-rich-text/lib/code.ts` forwards `language` and passes `codeTokenizer()` from `@loom-js/highlight`; no content changes (samples already carry `// @lang ts|bash|html`).
- Bundle: the tokenizer + three grammars (TypeScript, Bash, HTML) load on demand from `@loom-js/highlight` via `lazyImport`; pink ships none of it.
- Depends on nothing in flight; `route-scroll-option` and the copy-button work are independent.
