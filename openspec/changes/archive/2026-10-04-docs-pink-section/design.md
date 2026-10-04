# Design — docs-pink-section

## Context

Pink's surface today: elements (buttons, cards, inline code, copy button, tooltip popup…), components (code panel with tabs/copy/highlighting hooks, tables, tabs, side/top nav…), behaviors (`PinkCopyToClipboard`), modifiers (`withIcon`, `withTooltip`, `withAnchorLink`), the `--p-code-token-*` theme contract, its own stylesheet and icon font (the appwrite/pink 1.0.0 source adopted by `adopt-pink-source`, 2026-10-04), and a peer dependency on `@loom-js/core`. Storybook (port 6006; `loom-js-pink.vercel.app`) is the live catalog. The core docs' authoring pipeline (content map → drafts → review → publish, `contentful-sync/`) is proven and reusable.

## Goals / Non-Goals

**Goals:** a pink home on the docs site that answers "what is this, why would I use it, how do I start"; reference coverage scoped deliberately (not story-duplication); a drift anchor equivalent to the core README's role.

**Non-Goals:** documenting `@appwrite.io/pink` itself (link upstream); replacing Storybook; per-prop exhaustive tables for every component in v1 (the outline decides depth); pink 1.0 API commitments (docs describe the shipped 0.x surface, `pink-stays-pre-1-0` unchanged).

## Decisions

### D1 — Own group, overview-first

A "Pink" nav group with an overview topic leading it: positioning (design system for loom, Pink Design 1.0 continued from the archived appwrite/pink), install and the two stylesheet imports, theming entry points (theme classes, `usePinkTheming`, CSS variables), and a Storybook pointer. Reference topics follow in the group, scoped by the outline review. The group sits last, after Reference; `docs-information-architecture` is amended so trailing utility topics stay in the final _core_ group (the change's MODIFIED delta).

### D2 — The pink content map is the drift anchor

Core topics diff against the core README; pink has no such document, so the map this change produces (headings → topic outlines → source pointers into `packages/pink/src/**` and stories) _is_ the standing anchor, referenced by the coverage spec. It lives at `docs/pink-content-map.md` beside the core map (`readme-slim-down` moved the core map out of its change for the same reason: an archived change directory is not a living anchor) — amended 2026-10-04. If pink later grows a real README, the map re-anchors to it in a follow-up.

### D3 — Reuse the authoring pipeline wholesale

Topics author as `contentful-sync/`-style markdown, convert and push with the same tooling (converter gains nothing new), review as drafts, publish with the listing. The code-sample conventions (2-space, `@lang`, transitional copy, generic-vs-named components rule inverted: pink topics _should_ use pink components by name) carry over, recorded in the pink map.

### D4 — Pink's README is an npm card, not an anchor (added 2026-09-01)

Pink ships a short package README — one paragraph of purpose/layering, install, one example, links to the pink docs home and Storybook — so npm/GitHub aren't dead ends. It is deliberately _not_ a documentation source: the content map stays the drift anchor (D2), and the README carries no API reference to keep honest. The coverage spec's drift obligation does not extend to it beyond the links staying alive.

## Risks / Trade-offs

- [Docs duplicate Storybook and both drift] → the split is concepts/reference vs. playground; stories are linked, not transcribed; the map records which stories each topic leans on.
- [Pink's surface is still moving pre-1.0] → the coverage spec's drift obligation ties docs updates to pink changes the same way `docs-content-coverage` ties core topics to README edits.

## Migration Plan

Additive: group + topics publish as drafts through the standing flow. Nothing existing moves.

## Open Questions

- Topic partition (one reference topic vs. elements/components/behaviors split) — settled at outline review, not before.
