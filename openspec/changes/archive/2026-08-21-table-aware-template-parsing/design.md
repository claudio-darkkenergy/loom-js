# Design — table-aware-template-parsing

## Context

`htmlParser` (packages/core/src/html-parser.ts) parses each template once per chunks identity via
`getDocument().createRange().createContextualFragment(statics.join(TOKEN))`, walks the fragment
for token paths (`getPaths`), caches `{ fragment, paths, plan }`, and per instance re-clones via
`importNode` and wires updaters (`setUpdatesForPaths`). Two HTML-parser behaviors break tables:

1. **Root stripping.** `createContextualFragment` on a fresh range uses body context; the
   fragment parsing algorithm ignores table-part start tags there, so a `<tr>`-rooted template
   yields only its text content. Breaks `el('tr')`/`el('td')`/`el('thead')` and any
   table-part-rooted component template.
2. **Token foster-parenting.** Character tokens in table-content insertion modes (directly
   inside `<table>`, `<thead>`/`<tbody>`/`<tfoot>`, `<tr>`, `<colgroup>`) are foster-parented
   before the table during parsing, so the path recorded for a dynamic slot lands outside the
   authored position. Breaks dynamic row/cell lists and `el('table')({ children })`.

Both verified in Chrome. linkedom's lenient parser does neither, so server renders диverge from
browser renders today. Two existing seams matter: `getPaths` already collects `Comment` nodes
whose text matches the token, and `setUpdatesForPaths` carries an explicit note that `Comment`
could be enabled as a dynamic-node type. Comments are **not** foster-parented by the HTML
parser, and post-parse DOM mutation is table-safe (foster parenting is a parse-time behavior
only).

Constraints: no public API changes; templates without table markup must keep the exact current
parse path (byte-identical promise in `template-component-syntax`); the fix must behave
identically in the browser and against an injected linkedom window; nothing may touch the DOM
at module load.

## Goals / Non-Goals

**Goals:**

- Table-part-rooted templates keep their authored root element.
- Node-position interpolations inside table content stay in their authored position.
- Browser and injected-DOM renders of table templates produce the same tree.
- Non-table templates take the existing path, untouched.
- `el()` table-part tags work with zero changes to `el.ts`.

**Non-Goals:**

- SVG-rooted fragment parsing (`el('path')`, etc.) — same problem class, different context
  rules; a follow-up can extend the same seam.
- Converting all node slots to comment markers framework-wide — table scope only, for now.
- Hydration DOM-matching concerns — `hydrate` renders detached and swaps whole roots, so marker
  representation never needs to match pre-rendered markup.
- New public API. This is a parsing-fidelity bug fix.

## Decisions

### D1 — A table-scope scanner gates everything; non-table templates bypass it byte-identical

A small templating module (`table-scope.ts`) scans the joined statics once at cache time (after
`compileComponentTags`, so it sees the final statics). It answers two questions: does the
template start with a table-part tag, and which token positions sit in table content. If the
template contains no table-part tags, the parser proceeds exactly as today — the scanner is the
only added cost, and only at first-parse (cached thereafter).

The scanner must be tag-boundary aware — tokens inside attribute-value positions
(`<tr class=⚡>`) are not content positions and must be left alone — including quoted values
that may contain `>`. `compile-component-tags/grammar.ts` already models this class of scanning;
reuse its patterns where they fit.

_Alternative considered:_ skipping detection and routing every template through the new path —
rejected; it puts the byte-identical promise for existing templates at risk for no benefit.

### D2 — Table templates parse via a `<template>` element instead of a context-element map

When the scanner reports a table-part **root**, the statics parse via
`getDocument().createElement('template')` + `innerHTML`, and the template's `.content` becomes
the cached fragment. The HTML parser's "in template" insertion mode preserves table-part roots
(`<tr>`, `<td>`, `<thead>`, …) without needing to pick a per-tag context element, so one
mechanism covers every table-part root.

_Alternative considered:_ a context-element map (tr → tbody, td/th → tr, section → table,
col → colgroup) with `range.selectNodeContents(contextEl)` — workable, but it's a second
lookup table to maintain and gets the same result; the template element is the standard,
single-mechanism answer. Note template parsing does **not** fix mid-table token
foster-parenting (once `<table>` opens, table insertion modes apply inside a template too) —
that's D3's job either way.

### D3 — Tokens in table content are emitted as comment markers, swapped back at wire time

For token positions the scanner marks as table-content (directly inside `table`,
`thead`/`tbody`/`tfoot`, `tr`, `colgroup` — but not inside `td`, `th`, or `caption`, whose
content models allow text), the join emits `<!--⚡-->` instead of the bare token. Comments
survive table parsing in place, and `getPaths` already records comment nodes carrying the
token.

`setUpdatesForPaths` enables the anticipated `Comment` branch: when the resolved dynamic node
is a comment, replace it (post-parse — table-safe) with a token text node and run the existing
live-text machinery unchanged. Everything downstream (`getLiveTextNodes`, `getTextUpdate`,
reconciliation) sees exactly what it sees today.

_Alternative considered:_ comment markers for all node slots framework-wide — cleaner
long-term, but glue-text slots (`count: ⚡`) live inside mixed text nodes where a comment would
change splitting behavior for every template; far larger blast radius than this fix needs.

### D4 — Cache and plan interplay stay untouched

The cache stays keyed by original chunks identity; the scanner result and any marker
substitution affect only the parsed fragment, computed once at cache time. Component-element
compilation (`compileComponentTags`) runs first, exactly as today; the scanner sees the
compiled statics, so component tags inside tables (`<td><${Chip} /></td>` — a td-content
position, plain token) and table parts produced by compilation both resolve correctly.

### D5 — Parity is proven in both test lanes

Browser lane (wtr/Chromium): table-part roots survive, dynamic row lists render in place,
`el('tr')`/`el('td')`/`el('table')({ children })` work, updates re-render rows correctly, and a
non-table template's parse output is unchanged. Server lane (`node --test` + linkedom):
`renderToString` of the same table templates serializes the same markup the browser produces.
linkedom parses leniently, so the marker path must be exercised there too — comments and
template elements both exist in linkedom; the wire-time comment→text swap is parser-independent.

## Risks / Trade-offs

- [Scanner mis-classifies a token position (quoted `>` in an attribute, unusual whitespace)] →
  conservative tokenizer that tracks tag/attribute state like `compile-component-tags`; spec
  scenarios cover attribute tokens on table parts and text tokens inside `td`/`th`/`caption`.
- [Template-element parse path differs subtly from contextual-fragment for table templates] →
  the new path applies only to templates the old path destroyed outright; there is no working
  behavior to regress. Non-table templates never enter it.
- [linkedom template/comment behavior diverges from the browser] → server-lane tests run the
  identical templates; any divergence fails CI rather than shipping drift.
- [Foster-parenting rules differ across browsers] → only parse-time behavior is relied on for
  what we _avoid_ (comments in table content are spec-stable); the swap happens via DOM APIs
  after parsing, which have no table special-casing.

## Migration Plan

Patch changeset for `@loom-js/core` (bug fix, no API surface change). No consumer action:
previously-broken templates start working; `lib/contentful`'s rich-text table renderers heal
without modification. Rollback is reverting the parser change — no persisted state or format is
involved.

## Open Questions

- None blocking. Whether to later adopt comment markers for _all_ node slots (and extend the
  context-aware parse to SVG roots) is future work, deliberately out of scope.
