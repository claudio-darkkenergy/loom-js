# Design — docs-build-tool-topic

## Context

Deferred by design: the topic's source material is the build setup `server-first-loom-app` will finish (esbuild entrypoints, `htmlSplit` shells + `dynamic.js` chunks, prerender + state scripts). The old `build-tools` entry predates all of it.

## Goals / Non-Goals

**Goals:** one topic documenting the blessed build path end to end, drift-checkable against the plugin/app source it describes.

**Non-Goals:** documenting alternative bundlers; core README changes (this topic is outside the parity set); starting before the prerender pipeline ships.

## Decisions

### D1 — Slug `build-tool` (singular), rewriting the existing entry

Maintainer-named. The entry is reused for history; the slug changes at rewrite time — safe because the topic is unlisted/unpublished until this change, and old `/docs/build-tools` deep-link support was already declined (consistent with `get-started`).

### D2 — Source of truth is the shipped tooling; a build-package wrapper is the preferred shape

Maintainer lean (2026-08-30): ship the build story as a new loom package wrapping the esbuild assembly + `esbuild-plugin-html-split` (+ the prerender seam from `server-first-loom-app`) behind a simplified config — if the wrapper genuinely simplifies (the test: a minimal app's config shrinks, with a raw-esbuild escape hatch; if it mostly re-exposes options, it's indirection and the wrapper is dropped). That package would be its own tooling proposal after `server-first-loom-app`. This topic then documents the package's public config with the plugin as an internal; failing the wrapper, it documents the current wiring (`apps/loom/project/client/*` + the plugin), mirroring how README topics cite README headings — the future drift check diffs against whichever source ships.

### D3 — Tail placement before `feedback`

Learning path → build-tool → feedback: reference material after concepts, call-to-action last.

## Risks / Trade-offs

- [Written too early, it documents a moving target] → hard-sequenced after `server-first-loom-app`; the tasks open with a "source landed?" gate.

## Open Questions

None (deferred questions belong to the rewrite, once the source exists).
