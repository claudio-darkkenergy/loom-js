# TOC Sub-Section Links

## Why

The on-page TOC lists only a topic's h2 sections, but the deep content lives one level down — the routing API's per-function h3s, activities' returned-interface methods, the components examples. A reader scanning for `createRoutes` or `bind` gets no foothold; h3s don't even carry anchor ids today, so they can't be linked at all (maintainer request, 2026-09-01, during the components draft review).

## What Changes

- h3 headings gain anchor ids via the shared `headingAnchorId` convention (kebab, punctuation stripped) — with a dedupe rule, since h3 text can repeat across a topic's sections.
- `TopicToc` collects h3s alongside h2s and renders them as an indented sub-list nested under their parent h2 entry; `Toc` grows the nested-items shape.
- The content map's anchor convention extends to h3s (including the semi-permanence note: renaming an h3 now changes an anchor).
- Out of scope: h3 copy-link buttons (`withAnchorLink` stays h2-only for now), TOC scroll-spy/active tracking.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `docs-information-architecture`: gains an on-page TOC requirement — every h2 and h3 in a topic is anchored and listed, nested by level, with ids stable and unique within the topic.

## Impact

- `apps/loom` — `StyledRichText` (h3 ids + dedupe), `TopicToc` (two-level collection), `Toc` (nested rendering + styling). The shared `headingAnchorId` helper grows the dedupe rule both consumers inherit.
- `openspec/changes/align-loom-docs-with-core-readme/content-map.md` — convention amendment.
- No pink or core changes; no content changes (h3s exist in the drafts already).
