# Design — docs-build-tool-topic

## Context

Deferred by design: the topic's source material is the build setup `server-first-loom-app` will finish (esbuild entrypoints, `htmlSplit` shells + `dynamic.js` chunks, prerender + state scripts). The old `build-tools` entry predates all of it.

## Goals / Non-Goals

**Goals:** one topic documenting the blessed build path end to end, drift-checkable against the plugin/app source it describes.

**Non-Goals:** documenting alternative bundlers; core README changes (this topic is outside the parity set); starting before the prerender pipeline ships.

## Decisions

### D1 — Slug `build-tool` (singular), rewriting the existing entry

Maintainer-named. The entry is reused for history; the slug changes at rewrite time — safe because the topic is unlisted/unpublished until this change, and old `/docs/build-tools` deep-link support was already declined (consistent with `get-started`).

### D2 — Source of truth is the shipped tooling

Outline drafts from `esbuild-plugin-html-split`'s behavior and `apps/loom/project/client/*` as they exist post-`server-first-loom-app`, mirroring how README topics cite README headings — the future drift check diffs against those sources.

### D3 — Tail placement before `feedback`

Learning path → build-tool → feedback: reference material after concepts, call-to-action last.

## Risks / Trade-offs

- [Written too early, it documents a moving target] → hard-sequenced after `server-first-loom-app`; the tasks open with a "source landed?" gate.

## Open Questions

None (deferred questions belong to the rewrite, once the source exists).
