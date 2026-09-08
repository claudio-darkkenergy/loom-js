# Tasks — toc-sub-section-links

## 1. Shared anchor pass

- [ ] 1.1 `collectHeadingAnchors(document)` beside `headingAnchorId` in `styled-rich-text/lib/heading.ts`: one walk over top-level h2/h3 nodes → ordered entries `{ level, text, id }` with occurrence-suffix dedupe (D1)

## 2. Renderer

- [ ] 2.1 `StyledRichText` resolves h2/h3 ids from the shared pass (occurrence-keyed lookup, D3); h3s render with ids; h4 unchanged

## 3. TOC

- [ ] 3.1 `TopicToc` builds nested items from the same pass (h3s under their h2; headerless leading group tolerated, D2)
- [ ] 3.2 `Toc` renders nested children as an indented sub-list (smaller type, module CSS)

## 4. Verification & docs

- [ ] 4.1 Live check on `activities` (method h3s) and `components` (example h3s): every entry scrolls to its heading; ids equal hrefs; a constructed duplicate-text fixture suffixes correctly
- [ ] 4.2 Content map: extend the anchor convention to h3s (dedupe + semi-permanence note)
- [ ] 4.3 `pnpm -F @loom-js/loom type-check`; `pnpm format` over touched files
