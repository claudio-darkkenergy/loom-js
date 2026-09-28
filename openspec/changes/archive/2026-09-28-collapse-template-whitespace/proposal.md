# Collapse Template Whitespace

## Why

Loom templates pass authoring whitespace through verbatim: every newline and indent becomes a real text node. Under normal CSS the browser collapses it visually, so the fidelity buys nothing — while costing a text node per formatted line in every template — and under whitespace-sensitive styling it renders (pink's `code { white-space: pre-wrap }` turned `PinkInlineCode`'s template indentation into visible padding, forcing a `prettier-ignore` hug and then an `el('code')` rewrite). Formatting should never be content, and authors should never need an escape hatch (`${' '}`) to get correct spacing.

## What Changes

- Core's template parsing collapses **static formatting whitespace by default** — no opt-in, no per-template option:
    - A static whitespace run **containing a newline** is formatting: it collapses to a single space between content, and disappears entirely at the start or end of an element's child list.
    - A static whitespace run **without a newline** is authored content: untouched.
    - Inside `pre` and `textarea` (statically knowable tags), everything is preserved verbatim.
    - Interpolated values are content: never touched.
- Because a cross-line run between content becomes the single space the browser would have rendered anyway, **no escape hatch exists or is needed**: same-line spacing is honored as written, cross-line spacing yields exactly one space, and "no space" is expressed by writing the pieces on one line — ordinary formatting, not a workaround.
- Rendered output under `white-space: normal` is visually identical to today; whitespace-sensitive contexts (`pre-wrap` styling) now render the author's content instead of the author's indentation.
- The collapse happens once per template call site at static-processing time (cache-time), so per-render cost is zero and server/client output stays byte-identical.
- **Non-breaking at the API surface; DOM-shape visible**: templates produce fewer/normalized text nodes, so DOM/innerHTML snapshots change. Flagged in the changeset.

## Capabilities

### New Capabilities

- `template-whitespace-collapsing`: which static template whitespace is formatting vs. content — the newline rule, the child-list boundary rule, the `pre`/`textarea` carve-out, interpolation adjacency, visual parity under normal CSS, and server/client parity.

### Modified Capabilities

_None — `template-component-syntax`, `attr-value-semantics`, and `table-template-parsing` requirements hold unchanged; attribute values and component-tag compilation are out of scope._

## Impact

- `packages/core/src/lib/templating/` — the statics pass (pre-cache), interacting with `compile-component-tags` output and `table-scope` comment markers.
- `packages/core/tests/` — new unit + server-parity specs; existing specs' expected markup updated where they assert formatting text nodes.
- `packages/core/README.md` — templating section documents the rule (per `core-readme-accuracy`).
- Published: `@loom-js/core` **minor** changeset with a DOM-shape note.
- Follow-up (not in scope): `PinkInlineCode` can return to plain template form; the `el()` whitespace rationale comment goes away.
