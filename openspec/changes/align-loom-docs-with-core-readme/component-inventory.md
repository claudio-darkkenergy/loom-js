# Component inventory — align-loom-docs-with-core-readme

The D6 checkpoint: every UI need from the reviewed content map, resolved to (a) existing
`@loom-js/pink` export, (b) pink composition, or (c) upstream appwrite/pink port candidate.
Every (c) has a named fallback. Note: `@appwrite.io/pink@1.0.0`'s stylesheet (already loaded by
the app) ships `.alert*`, `.table*`, and `.inline-code` selectors — so every candidate port is
markup-only over existing CSS, no new styles.

| #   | UI need (map ref)                                                     | Resolution                                                                                       | Detail                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Block code samples: line numbers + language header (conv 2, task 3.1) | (a) existing                                                                                     | `PinkCodePanel` + `PinkCodePanelHeader` + `PinkCodePanelContent` (`useLineNumbers` already supported). App-renderer composition only.                                                                                                            |
| 2   | Inline code in mixed paragraphs (conv 3, task 3.1)                    | **(c) candidate: `PinkInlineCode`**                                                              | Upstream `.inline-code` element. **Fallback:** renderer emits `el('code')` with class `inline-code` (app-local markup over the shipped class).                                                                                                   |
| 3   | Callouts from `BLOCKS.QUOTE` (conv 4, task 3.2)                       | **(c) candidate: `PinkAlert`**                                                                   | Upstream `alert` component (`.alert`, `.alert-title`, `.alert-content`, state modifiers). **Fallback:** composition of `PinkCard` + `PinkStatus`.                                                                                                |
| 4   | Rich-text tables (conv 5, task 3.3)                                   | **(c) candidate: `PinkTable`**                                                                   | Upstream `table` component (`.table`, `.table-thead`, `.table-row`, `.table-col`, `.table-with-scroll`). **Fallback:** semantic `<table>` markup in the app renderer with minimal app-local styling — no existing pink composition fits a table. |
| 5   | Cross-topic links, client-side (conv 6, task 3.4)                     | (a) existing (core)                                                                              | `RouteLink` from `@loom-js/core`, mapped in the renderer for `/docs/<slug>` hyperlink URIs. Not a pink concern.                                                                                                                                  |
| 6   | Prev/next `TopicPagination` (task 3.5)                                | (b) composition                                                                                  | `PinkButton` (+ `PinkCard` framing if needed) per D5; derived from the `page` listing. App component.                                                                                                                                            |
| 7   | Side nav: order + selected state (task 3.6)                           | (a) existing                                                                                     | `PinkSideNav` via the existing `DocsSideNav`; verify only.                                                                                                                                                                                       |
| 8   | On-page TOC / anchored h2s                                            | (a) existing                                                                                     | `TopicToc` + `StyledRichText` heading anchoring, already shipped.                                                                                                                                                                                |
| 9   | API signature blocks (conv 7)                                         | none needed                                                                                      | Bold-led rich-text paragraphs + inline code (need #2).                                                                                                                                                                                           |
| 10  | Copy code on panel headers (entry review, 2026-08-29)                 | **(c) approved: `PinkCopyToClipboard` behavior + `PinkCopyButton` + `PinkCodePanel.CopyButton`** | Behavior-type component (host around any children, state-aware `render`); button/anchor composition over `PinkButton` with a bound icon. Maintainer-directed composition.                                                                        |
| 11  | Heading link-copy anchors (entry review, 2026-08-29)                  | (b) composition (app)                                                                            | `AnchoredHeading` in `styled-rich-text/lib/heading.ts`: h2 + `PinkCopyButton({ href })` routed through `route()`.                                                                                                                                |

## Port verdicts (task 2.2)

Presented individually to the maintainer; verdicts recorded here.

- `PinkInlineCode` — **approved** (2026-08-21): `<code>` root element + the `.inline-code` class,
  per upstream https://github.com/appwrite/pink/blob/main/apps/pink/src/pages/elements/inline-code.mdx.
- `PinkAlert` — **deferred** (2026-08-21): the alert convention doesn't feel right for docs
  callouts, and the root must be a `<blockquote>`. Task 3.2 implements the fallback composition —
  `PinkCard` with `is=el('blockquote')` (the `is` prop makes the root semantic for free) plus a
  `PinkStatus`/`PinkInlineTag` accent — and the port question is revisited after seeing it with
  real content. If ported later, `PinkAlert` keeps the blockquote root (the `.alert` classes
  don't constrain the tag).
- `PinkTable` — **approved** (2026-08-21): markup-only over the shipped `.table*` classes.
