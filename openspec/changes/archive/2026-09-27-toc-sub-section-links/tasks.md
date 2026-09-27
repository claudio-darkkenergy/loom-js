# Tasks — toc-sub-section-links

## 1. Shared anchor pass

- [x] 1.1 `collectHeadingAnchors(document)` beside `headingAnchorId` in `styled-rich-text/lib/heading.ts`: one walk over top-level h2/h3 nodes → ordered entries `{ level, text, id }` with occurrence-suffix dedupe (D1) _(2026-09-27: lives in the new pure `lib/heading-anchors.ts` (no DOM/pink import, so a node script can test it); `heading.ts` re-exports. Entries carry the source node — the renderer keys by node identity rather than by occurrence count, a stronger form of D3's lookup. Heading text is the concatenation of all descendant text nodes (inline code splits them), matching GitHub's slugger)_

## 2. Renderer

- [x] 2.1 `StyledRichText` resolves h2/h3 ids from the shared pass (occurrence-keyed lookup, D3); h3s render with ids; h4 unchanged _(2026-09-27: `anchors.idOf(node)` for h2 (AnchoredHeading) and h3 (`el('h3')` with `id`, no copy-link); h4 untouched)_

## 3. TOC

- [x] 3.1 `TopicToc` builds nested items from the same pass (h3s under their h2; headerless leading group tolerated, D2) _(2026-09-27: `toTocItems` over the shared pass; nested field is `items` (not `children`, the reserved prop))_
- [x] 3.2 `Toc` renders nested children as an indented sub-list (smaller type, module CSS) _(2026-09-27: `TocList`/`TocListItem` mutually recursive with explicit `Component<…>` types; `Toc.module.css` `.subList` — 0.875em, one indent step, tighter rhythm)_

## 4. Verification & docs

- [x] 4.1 Live check on `activities` (method h3s) and `components` (example h3s): every entry scrolls to its heading; ids equal hrefs; a constructed duplicate-text fixture suffixes correctly _(2026-09-27 headless-browser pass on the dev server: activities 8 h2 + 8 nested, components 9 + 11, routing 6 + 7 — every TOC href has a matching id, zero h4 ids, clicking a nested entry sets the hash and lands the heading at the top; duplicate/split-text fixture via `tsx` against the pure pass: `examples`/`examples-1`, `basic-example`/`basic-example-1`, `the-key-prop`, `render-to-string-sync`, orphan h3 → headerless group. The six formerly dead h3 cross-links all resolve live)_
- [x] 4.2 Content map: extend the anchor convention to h3s (dedupe + semi-permanence note) _(2026-09-27: rich-text convention 1 extended — h3 anchors, concatenated inline runs, GitHub-style dedupe, semi-permanence for both levels, h4+ out)_
- [x] 4.3 `pnpm -F @loom-js/loom type-check`; `pnpm format` over touched files _(2026-09-27: `tsc --noEmit` clean; prettier over the six touched files)_
