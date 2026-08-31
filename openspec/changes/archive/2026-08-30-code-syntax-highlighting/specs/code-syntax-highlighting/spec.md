## ADDED Requirements

### Requirement: Code panel content renders language-aware tokens

`PinkCodePanel.Content` SHALL accept a `language` identifier and, when it names a registered grammar, render each line's source as a sequence of token elements classed by token kind from pink's fixed vocabulary, preserving the source text verbatim (whitespace, indentation, line breaks) and the existing line-number grid. Without `language`, or with an unregistered language, the content SHALL render as plain text exactly as before.

#### Scenario: TypeScript sample is tokenized

- **WHEN** `PinkCodePanel.Content({ children: source, language: 'ts' })` renders a TypeScript sample containing a keyword, a string, and a comment
- **THEN** the keyword, string, and comment text each render inside a token element carrying the matching kind class, and the panel's concatenated text content equals the source

#### Scenario: unknown language renders plain

- **WHEN** `language` is omitted or names no registered grammar
- **THEN** each line renders as a single plain text node with no token elements, identical to the pre-highlighting output

#### Scenario: multi-line tokens keep line ownership

- **WHEN** a sample contains a token spanning several lines (a block comment or a template literal)
- **THEN** every line still renders as its own row with its own line number, and the token's kind class applies to the token's text on each of those rows

#### Scenario: language aliases resolve

- **WHEN** `language` is a documented alias (`ts`, `sh`, `shell`, `xml`)
- **THEN** it resolves to the corresponding registered grammar (`typescript`, `bash`, `markup`)

### Requirement: Token colors come from a themed variable contract

Pink SHALL define one CSS custom property per token kind (`--p-code-token-<kind>`) on `.code-panel`, SHALL ship a bundled preset assigning every kind a value for the dark theme and a counterpart for `.theme-light`, and token elements SHALL take their color only from those variables — so a consumer redefining the variables re-themes every panel with no component change.

#### Scenario: bundled preset colors tokens

- **WHEN** a highlighted panel renders with pink's stylesheet and no consumer overrides
- **THEN** each token kind's computed color equals the bundled preset's value for the active theme

#### Scenario: consumer override re-themes

- **WHEN** a consumer redefines `--p-code-token-<kind>` for one or more kinds on `.code-panel` or an ancestor
- **THEN** tokens of those kinds render in the overridden colors and all other kinds keep the preset

#### Scenario: light theme stays legible

- **WHEN** the panel renders under `.theme-light`
- **THEN** every token kind's color against the light panel background meets WCAG AA contrast for body text

### Requirement: Tokenization is pure and render-path safe

Tokenization SHALL be a synchronous, deterministic text-to-tokens function with no DOM dependency, invoked inside the component's render; grammar loading SHALL be tracked by the settlement signal (via `lazyImport`), so `renderToString` (injected window) waits for it and the browser render, once settled, produces identical markup for the same input.

#### Scenario: server and client markup match

- **WHEN** the same `PinkCodePanel.Content` props render via `renderToString` against a linkedom window and via `init` in a browser
- **THEN** the serialized panel markup is identical, and hydrating the server markup performs no DOM correction

#### Scenario: no global tokenizer side effects

- **WHEN** pink's tokenizer module is imported
- **THEN** it registers no document-level hooks and does not scan or mutate the DOM (Prism's automatic highlighting is disabled)

### Requirement: The docs app forwards the content language

The docs app's rich-text code rendering SHALL pass the `// @lang` directive's label as the panel's `language`, keeping the label as the header text, so authored content needs no new convention.

#### Scenario: directive drives highlighting

- **WHEN** a code-marked paragraph starts with `// @lang ts`
- **THEN** the rendered panel shows the `ts` header label and TypeScript-tokenized content

#### Scenario: undirected blocks stay plain

- **WHEN** a multi-line code-marked paragraph carries no `@lang` directive
- **THEN** the panel renders with no header and plain, un-tokenized content
