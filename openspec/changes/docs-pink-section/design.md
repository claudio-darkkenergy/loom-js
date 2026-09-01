# Design — docs-pink-section

## Context

Pink's surface today: elements (buttons, cards, inline code, copy button, tooltip popup…), components (code panel with tabs/copy/highlighting hooks, tables, tabs, side/top nav…), behaviors (`PinkCopyToClipboard`), modifiers (`withIcon`, `withTooltip`, `withAnchorLink`), the `--p-code-token-*` theme contract, and a peer relationship with `@appwrite.io/pink` (upstream CSS) + `@loom-js/core`. Storybook (port 6006) is the live catalog. The core docs' authoring pipeline (content map → drafts → review → publish, `contentful-sync/`) is proven and reusable.

## Goals / Non-Goals

**Goals:** a pink home on the docs site that answers "what is this, why would I use it, how do I start"; reference coverage scoped deliberately (not story-duplication); a drift anchor equivalent to the core README's role.

**Non-Goals:** documenting `@appwrite.io/pink` itself (link upstream); replacing Storybook; per-prop exhaustive tables for every component in v1 (the outline decides depth); pink 1.0 API commitments (docs describe the shipped 0.x surface, `pink-stays-pre-1-0` unchanged).

## Decisions

### D1 — Own group, overview-first

A "Pink" nav group with an overview topic leading it: positioning (design system for loom, layered on Appwrite's Pink), install/peer setup, theming entry points (`code-tokens.css`, CSS variables), and a Storybook pointer. Reference topics follow in the group, scoped by the outline review.

### D2 — The pink content map is the drift anchor

Core topics diff against the core README; pink has no such document, so the map this change produces (headings → topic outlines → source pointers into `packages/pink/src/**` and stories) _is_ the standing anchor, checked into the change and referenced by the coverage spec. If pink later grows a real README, the map re-anchors to it in a follow-up.

### D3 — Reuse the authoring pipeline wholesale

Topics author as `contentful-sync/`-style markdown, convert and push with the same tooling (converter gains nothing new), review as drafts, publish with the listing. The code-sample conventions (2-space, `@lang`, transitional copy, generic-vs-named components rule inverted: pink topics _should_ use pink components by name) carry over, recorded in the pink map.

## Risks / Trade-offs

- [Docs duplicate Storybook and both drift] → the split is concepts/reference vs. playground; stories are linked, not transcribed; the map records which stories each topic leans on.
- [Pink's surface is still moving pre-1.0] → the coverage spec's drift obligation ties docs updates to pink changes the same way `docs-content-coverage` ties core topics to README edits.

## Migration Plan

Additive: group + topics publish as drafts through the standing flow. Nothing existing moves.

## Open Questions

- Topic partition (one reference topic vs. elements/components/behaviors split) — settled at outline review, not before.
