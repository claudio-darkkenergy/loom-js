# Tasks — code-syntax-highlighting

## 1. Tokenizer adapter (`@loom-js/highlight` — extracted from pink mid-implementation, maintainer decision 2026-08-29)

- [x] 1.1 New workspace `packages/highlight` (`@loom-js/highlight`: package.json/tsconfig/rollup mirroring pink, `.prettierrc` `packageJSONFiles` entry, README); add `prismjs` (+ `@types/prismjs`) there — pink carries none; import `prismjs/components/prism-core` with manual mode and the `typescript`, `bash`, `markup` grammars explicitly — confirm no DOM hooks register on import (spec: no global side effects)
- [x] 1.2 `packages/highlight/src/tokenize.ts`: the canonical token vocabulary (`CodeTokenKind`), the alias registry (`ts`→`typescript`, `sh`/`shell`→`bash`, `xml`→`markup`), the Prism-type→kind map (unmapped → `plain`), and `tokenizeCode(text, language): CodeToken[]` (returns `[{ kind: 'plain', text }]` for unknown languages)
- [x] 1.3 `codeTokenizer()` — the `lazyImport` activity over Prism + grammars (`packages/highlight/src/prism.ts`); in pink, `lib/token-lines.ts` holds the structural `CodeToken`/`Tokenize` contract and `splitTokenLines(tokens): CodeToken[][]` beside `splitCodeLines` — slices the flat token stream at `\n` so multi-line tokens carry their kind onto every row; both pure, no render concerns

## 2. Rendering (pink)

- [x] 2.1 `PinkCodePanel.Content`: add `language?: string` + `tokenize?: TokenizeActivity`; with both, render each `CodeLine` from token slices as `<span class="code-token is-<kind>">` children of the `<pre>`; otherwise keep today's single text node (byte-identical output)
- [x] 2.2 Theme CSS in pink's stylesheet layer: `--p-code-token-<kind>` for every kind on `.code-panel` (Ayu Dark), `.theme-light` counterpart (Ayu Light), and `.code-token.is-<kind> { color: hsl(var(--p-code-token-<kind>)) }` — no color literals outside the preset block
- [x] 2.3 Storybook: `WithHighlighting` stories for TypeScript (with an `html\`…\``template), Bash, and HTML; a`ThemeOverride` story redefining two variables
- [x] 2.4 `pnpm -F @loom-js/pink type-check`, `build-package`; note the bundle delta (target ≤ 10 KB gz) in the changeset; **minor** pink changeset — Prism is external to the dist bundle and loads on demand (~8 KB gz core + grammars, first highlighted panel only); pink dist itself unchanged in size

## 3. Docs app

- [x] 3.1 `styled-rich-text/lib/code.ts`: forward the directive label as `language` and pass `codeTokenizer()` from `@loom-js/highlight` (app dependency added) on `PinkCodePanel.Content`; no content or convention change
- [x] 3.2 `pnpm -F @loom-js/loom type-check`; `pnpm format` over touched files

## 3b. Shell delivery (implementation finding)

- [x] 3b.1 `esbuild-plugin-html-split`: classify dynamic-import JS targets into `templateArgs.dynamic.js`; loom `template.html.mts` script-tags only route-scoped dynamic chunks — grammar chunks load solely via `import()` (design D7); verified on a prod build's shells

## 4. Verification

- [x] 4.1 (verified 2026-08-29: identical token signature, 21 lines / 89 runs, node linkedom render vs. browser DOM) Server/client parity: `renderToString` a highlighted panel against linkedom and diff against the browser render's `outerHTML` — identical; hydrate the server markup and confirm no correcting mutations
- [x] 4.2 Visual pass on `/docs/components` and `/docs/routing` (dark) and under `.theme-light`: every kind visibly distinct, comments recede, template literals read as strings; contrast spot-check on `comment`/`punctuation`
- [x] 4.3 Maintainer eyeballed Ayu Dark on the rendered panel (2026-08-29): approved, with a brand tint — `keyword` → brand orange, `constant`/`number`/`variable` → brand pink (recorded in design.md D3)
- [x] 4.4 Plain fallback: a panel without `language` and one with an unknown label render exactly as before (DOM diff against the pre-change output)
