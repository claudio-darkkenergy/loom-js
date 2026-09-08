# Design — toc-sub-section-links

## Context

`TopicToc` reduces the rich-text document's top level to h2 text → `#anchor` items; `Toc` renders a flat `<ul>`. `StyledRichText` gives h2s ids through `headingAnchorId` (kebab + punctuation strip, GitHub-slugger parity) and gives h3s none. h3 text is not unique within a topic in general (method-style h3s like `effect`, `bind` are today, but example h3s and future content make collisions a matter of time).

## Goals / Non-Goals

**Goals:** every h2/h3 anchored and TOC-listed with visible hierarchy; one id convention shared by renderer and TOC so they cannot drift; ids unique within a topic and stable across renders.

**Non-Goals:** h4+ in the TOC (depth stops at h3 — deeper is noise); h3 copy-link affordances; scroll-spy; changing any heading text.

## Decisions

### D1 — Dedupe: GitHub-style occurrence suffix, document order

`headingAnchorId` stays pure per heading; uniqueness is the document pass's job: the first occurrence keeps the bare id, repeats get `-1`, `-2`, … in document order — GitHub's exact behavior, so a heading's docs anchor and its README anchor stay identical even under collision. Implemented as one pass that walks the document's headings once and hands both the renderer and the TOC the same computed list (a shared `collectHeadingAnchors(document)` helper beside `headingAnchorId`), rather than two independent counters that could disagree.

### D2 — TOC nests as a sub-list, collection follows document order

`TopicToc` walks top-level nodes once: h2 opens an entry, h3 appends to the open entry's children (an h3 before any h2 — not a shape the conventions allow — folds into a headerless leading group rather than crashing). `Toc` renders `items[].children` as a nested `<ul>` inside the parent `<li>`, indented one step, smaller type; anchors are plain `#id` links exactly as today's h2 items.

### D3 — Renderer ids come from the same computed pass

`StyledRichText` resolves each heading's id by looking up the shared pass's result (keyed by occurrence), not by re-kebabing inline — the lookup is what guarantees the TOC link and the rendered id agree even for duplicates. h4 stays id-less.

## Risks / Trade-offs

- [Long TOCs (activities: ~6 h3s under one h2) crowd the rail] → nesting and smaller type carry the hierarchy; if a topic's TOC grows unwieldy the fix is content structure, not TOC truncation.
- [Occurrence-suffixed anchors are order-fragile] → same semi-permanence rule h2s already carry, now stated for h3s in the map: reordering repeated-text sections changes suffixes; unique text is the stable path.

## Migration Plan

App-only; existing h2 anchors unchanged (first occurrences keep bare ids). Ships with the standing draft-review cycle — no content edits required.

## Open Questions

None.
