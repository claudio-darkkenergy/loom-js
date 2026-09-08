# Design — code-syntax-highlighting

## Context

`PinkCodePanel.Content` (`packages/pink/src/components/pink-code-panel/pink-code-panel-content.ts`) splits source into lines (`splitCodeLines`, a pure helper — SOLID audit SRP entry) and renders each as `CodeLine`: a `.grid-code` row of an optional line-number cell and a `<pre>` holding the raw text. The docs app's `CodeSample` (`styled-rich-text/lib/code.ts`) already knows the language from the `// @lang` directive and shows it as the header label; content ships at 2-space indent. The site is dark-first (`theme-dark`), brand orange (`--brand-color-1: 32°`) and pink (`--brand-color-2: 325°`).

Pink is a design system over `@appwrite.io/pink`: it ships CSS variables and classes, and its components are loom templates. Anything added here runs in the browser and, after `server-first-loom-app`, inside linkedom at build time — so the render path must stay DOM-free and deterministic.

## Goals / Non-Goals

**Goals:**

- Themed, token-level highlighting for TypeScript, Bash, and HTML samples in `PinkCodePanel.Content`, selectable per panel via `language`.
- One bundled theme preset from the maintainer's candidates; theme expressed as CSS variables so presets swap without touching components.
- Server-safe: identical markup from `renderToString` and the client render.
- Zero change for panels without `language`.

**Non-Goals:**

- Line highlighting, diff markers, ranges, or focus lines.
- Client-side theme switching UI (a consumer can flip variables; no pink control for it).
- Highlighting inside `PinkInlineCode`.
- Every language: three grammars now; the registry accepts more later.

## Decisions

### D1 — Tokenizer lives in `@loom-js/highlight`, inverted into pink; pink owns only the contract

Prism core + three grammars, via `Prism.tokenize(text, grammar)` — a pure token tree, no DOM — wrapped in a new published package, `@loom-js/highlight` (`packages/highlight`). It exports `codeTokenizer()`, a `lazyImport` activity resolving to `Tokenize = (text, language) => CodeToken[]`, plus the canonical `CodeTokenKind` vocabulary and `resolveLanguage` aliases. `PinkCodePanel.Content` takes `tokenize?: TokenizeActivity` (core's `lazyImport` type — pink already depends on core) and a structural `CodeToken { kind: string; text: string }`; pink has **no** highlighting dependency, and the next UI library implements the same two-prop contract against the same package instead of re-owning Prism.
_Alternatives considered:_ **Prism inside pink** (the first cut) — works, but every UI library would duplicate the adapter and manage the dependency; rejected once a second library was on the horizon. **App-local adapter** — no duplication today, but the next library's app re-creates it; a shared package costs one workspace. **Shiki** — TextMate-grade output but a WASM regex engine + large grammars, async-only API; wrong trade for docs-sized samples. **highlight.js** — auto-detection and heavier per-language modules. **Hand-rolled tokenizer** — TS with `html\`…\`` templates is the hard case; not worth owning.

### D2 — Token vocabulary is `@loom-js/highlight`'s, not Prism's; pink themes it

Prism token types map onto a fixed vocabulary owned by the highlight package — `comment`, `keyword`, `string`, `number`, `function`, `property`, `tag`, `attr-name`, `attr-value`, `punctuation`, `operator`, `variable`, `constant`, `regex`, `plain` — rendered as `<span class="code-token is-<kind>">`. Pink's theme CSS targets those kinds (`code-token is-<kind>`); a tokenizer swap re-maps once in the highlight package, and pink's `CodeToken` stays structural so the two packages share no import. Unmapped Prism types fall to `plain`.

### D3 — Theme as CSS variables on `.code-panel`, preset **Ayu Dark**, light counterpart included

Each kind gets `--p-code-token-<kind>` (HSL triplet, pink's convention). The bundled preset is **Ayu Dark** (maintainer-confirmed 2026-08-29): its palette is orange/gold-led (`#FFB454` functions, `#F29668` operators, `#AAD94C` strings, `#39BAE6` tags, `#59C2FF` constants) which sits naturally with the brand's orange and pink accents on the neutral-100/200 panel, and its contrast ratios clear WCAG AA on that ground. A `.theme-light` block uses Ayu Light (same family) so panels don't go unreadable under the light theme. Two kinds are brand-tinted on top of Ayu Dark (maintainer request, 2026-08-29): `keyword` on the brand orange (32°) and `constant`/`number`/`variable` on the brand pink (325°) in place of Ayu's purple; the light counterpart keeps Ayu Light's hues darkened to clear AA (Ayu Light as published does not). Vercel and Monokai Dimmed remain one-file presets a consumer (or a later change) can drop in by redefining the variables; nothing else in pink references colors directly.
_Alternatives considered:_ Vercel — cleaner but its accent blue/purple fights the brand accents on this ground; Monokai Dimmed — muted by design, and on neutral-200 the muting loses contrast on `comment`/`punctuation`. Both are valid swaps if the maintainer prefers them after seeing the panel.

### D4 — Pure tokenization; grammar loading is settlement-tracked

`tokenizeCode(prism, text, language)` is a pure, synchronous text→tokens step, and multi-line tokens are sliced per row by `splitTokenLines` so each `CodeLine` still owns its line number — both helpers sit beside `splitCodeLines`. The Prism instance reaches it through `lazyImport` (see D5), so the panel renders its lines inside the import's `effect`: plain until the grammars land, tokenized after. Because `lazyImport` is tracked by the settlement signal, `renderToString` waits for the grammars and serializes tokenized markup, and `hydrate` swaps only once the client has the same — server and client DOM stay identical (spec: server and client markup match).
_Implementation finding:_ the original plan (static grammar imports, sync end to end) does not survive bundlers with code splitting — esbuild does not preserve side-effect import order inside a shared chunk and evaluated Prism's grammar modules before its core, throwing `Prism is not defined`. Any consumer bundling pink with splitting would hit it, so ordering had to become a runtime guarantee.

### D5 — Loading: sequential dynamic imports behind `lazyImport`, first consumer triggers

Core and each grammar are `await import()`ed in dependency order inside one `lazyImport` importer in `@loom-js/highlight`, keyed once per page (`loom:highlight:tokenizer`): order is guaranteed by the awaits, the manual flag is set on the global before core evaluates (no document scan), and nothing loads until the first highlighted panel renders. Non-highlighting consumers ship no Prism bytes at all — pink itself never imports it. A consumer wanting an even earlier start can call the same importer at boot; pink doesn't pre-decide that.

### D6 — Language pass-through in the docs app

`CodeSample` forwards the `@lang` label as `language`. Labels are already `ts` / `bash` / `html`; the adapter's registry maps aliases (`ts`→`typescript`, `sh`/`shell`→`bash`, `xml`→`markup`) so content authors keep writing the short forms. An unknown label still shows as the header text and renders plain.

### D7 — Shells never script-tag non-route dynamic chunks (html-split)

The app's shell template listed every esbuild output as a `<script type="module">`, including targets of dynamic `import()`s — which eagerly evaluated the grammar chunks before core (`Prism is not defined`), and a module that throws during evaluation stays failed for the later `import()`, so the tokenizer never resolved. `esbuild-plugin-html-split` now surfaces dynamic-import targets as `templateArgs.dynamic.js` instead of folding them into `common.js`/`js`; the loom template script-tags only the route page chunks from that bucket (the existing preload of a shell's own page module) and nothing else `import()`ed. Prod shells: `chunk-*`, route chunks, `spa.js` — no `prism-*`. _Implementation finding; general rule for any consumer whose lazily-loaded module depends on an importer-sequenced global._

## Risks / Trade-offs

- [Client-only renders show a plain→highlighted transition] → bounded to the first highlighted panel per page (the import is cached); prerendered pages ship highlighted markup and hydrate without a flash, which is the docs app's target state (`server-first-loom-app`).
- [Prism's tokenizer misreads loom's `html\`…\``templates inside TS] → Prism's TS grammar tokenizes template literals as`template-string`with`interpolation`sub-tokens; the inner HTML stays a string kind rather than tags. Acceptable for v1 (it's how most editors show it without an injected grammar); a later change can add an`html`-in-template injection if it earns its keep.
- [Theme contrast on the light theme is untested until built] → Ayu Light block is part of the change; verification task checks both themes.
- [Bundle growth on pink for consumers that never render code] → grammars are tree-shakeable only at module granularity; ~8 KB gz accepted for a design-system component that renders code. Documented in the changeset.
- [`@appwrite.io/pink` upstream adds its own highlighting later] → pink's vocabulary/variables are our contract; an upstream arrival would be a mapping question, not a rewrite.

## Migration Plan

Additive minor release of `@loom-js/pink`; the docs app opts in by forwarding `language` (one-line change). Panels without `language` are unchanged, so consumers upgrade freely.

## Open Questions

None — the maintainer confirmed Ayu Dark as the bundled preset (2026-08-29).
