## ADDED Requirements

### Requirement: Cross-line static whitespace is formatting

A static whitespace run containing a newline SHALL collapse: to a single space between two content items (text, elements, or interpolation slots), and to nothing at the start or end of an element's child list. A static whitespace run containing no newline SHALL be preserved exactly as authored. Interpolated values SHALL never be altered.

#### Scenario: indentation around an element's sole child disappears

- **WHEN** a template authors `<code>` on one line, an interpolated child on the next (indented), and the closing tag on a third
- **THEN** the rendered element contains only the interpolated content — no leading or trailing text nodes — even when the element is styled `white-space: pre-wrap`

#### Scenario: cross-line content keeps a single space

- **WHEN** two interpolations (or an interpolation and text, or two inline elements) are authored on separate lines within the same parent
- **THEN** exactly one space renders between them, matching what `white-space: normal` would have displayed for the original run

#### Scenario: same-line spacing is authored content

- **WHEN** a template contains a space with no newline (e.g. `Hello <b>world</b>`, or `<span> ${value}</span>`)
- **THEN** the space is preserved exactly

#### Scenario: no escape hatch is required

- **WHEN** an author wants a space between cross-line items, no space, or a boundary space
- **THEN** each intent is expressible as plain formatting (separate lines; same line; a same-line space) with no special interpolation such as `${' '}`

### Requirement: Preformatted elements preserve whitespace verbatim

Static whitespace inside `pre` and `textarea` elements (including `pre` descendants) SHALL be preserved exactly as authored.

#### Scenario: pre content keeps its layout

- **WHEN** a template authors multi-line content inside `<pre>` (directly or nested below it)
- **THEN** every newline and indent renders exactly as written

### Requirement: Collapsing is static, cached, and parity-safe

The collapse SHALL run once per template call site over the static chunks before context caching, treating interpolation slots as content items and table-scope comment markers as content, and SHALL produce identical markup on the server (`renderToString`) and in the browser for the same template.

#### Scenario: server and client agree

- **WHEN** the same template renders via `renderToString` against an injected window and via `init` in a browser
- **THEN** the serialized markup is identical, and hydrating the server markup performs no whitespace-correcting mutations

#### Scenario: no per-render cost

- **WHEN** a component re-renders
- **THEN** no whitespace processing re-runs — the cached statics are already normalized

### Requirement: Visual output under normal CSS is unchanged

For content styled `white-space: normal`, the rendered appearance of any template SHALL be indistinguishable from the pre-collapse behavior.

#### Scenario: inline siblings across lines keep their visible gap

- **WHEN** two inline elements are authored on separate lines
- **THEN** the visible space between them is identical before and after this change
