# Table-aware template parsing in core

## Why

Loom parses every template with `createRange().createContextualFragment()` under a body-context,
so the HTML parser's table rules silently destroy table markup: a `<tr>`/`<td>`/`<thead>`-rooted
template collapses to its text content, and an interpolation token placed directly inside
`<table>`/`<tbody>`/`<tr>` is foster-parented out of the table (verified in Chrome). This means
`el('tr')`, `el('td')`, any table-part-rooted component, and any dynamic row list are broken in
the browser today — including the already-shipped Contentful rich-text renderer's
`BLOCKS.TABLE_ROW`/`TABLE_CELL` mappings — while linkedom's lenient parser masks the problem in
server renders, so SSR output and browser output drift. Tables are a general framework need
(surfaced by the docs-app change `align-loom-docs-with-core-readme`, which is blocked on this
for its approved `PinkTable` port and rich-text table rendering).

## What Changes

- Template parsing becomes table-aware: a template whose root is a table-part element (`tr`,
  `td`, `th`, `thead`, `tbody`, `tfoot`, `caption`, `colgroup`, `col`) parses under the correct
  context element instead of body context, so the authored root survives.
- Interpolation slots inside table content (directly under `table`, `thead`/`tbody`/`tfoot`,
  `tr`, `colgroup`) survive parsing instead of being foster-parented out, so dynamic children —
  row lists, cell lists, `el('table')({ children })` — render in place.
- Browser and injected-DOM (linkedom) renders produce the same tree for table templates — no
  server/client drift.
- Templates containing no table markup are untouched — the existing parse path and its caching
  stay byte-identical.
- No public API changes: `component()`, `el()`, and element syntax keep their exact signatures;
  previously-broken templates start working.

## Capabilities

### New Capabilities

- `table-template-parsing`: the parsing-fidelity contract for table markup in templates —
  table-part-rooted templates keep their root, interpolations within table content stay in
  place, and browser/server renders agree.

### Modified Capabilities

- `core-element-components`: the `el()` requirement gains explicit coverage that table-part
  tags (`el('tr')`, `el('td')`, …) render their named element like any other tag — the current
  spec text promises "the named plain HTML tag" but table parts violate it silently.

## Impact

- `packages/core/src/html-parser.ts` — context-element selection and token handling for table
  content; the template cache keying must keep working.
- `packages/core/src/lib/templating/` — path resolution / live-node discovery if the token
  representation changes inside table content.
- Tests: browser lane (`tests/unit/`) for parse fidelity and dynamic rows; server lane
  (`tests/server/`) for linkedom parity.
- Heals `lib/contentful/src/rich-text-renderer/default-renderers.ts` table mappings with no
  change there.
- Unblocks `align-loom-docs-with-core-readme` tasks 2.3b (`PinkTable`) and 3.3 (rich-text
  tables).
- No changes to `@loom-js/pink`, apps, or services in this change. Patch-level core changeset
  (bug fix, no API surface change).
