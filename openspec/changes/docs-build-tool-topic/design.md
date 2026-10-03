# Design — docs-build-tool-topic

## Context

Deferred by design: the topic's source material is the build setup `server-first-loom-app` will finish (esbuild entrypoints, `htmlSplit` shells + `dynamic.js` chunks, prerender + state scripts). The old `build-tools` entry predates all of it.

## Goals / Non-Goals

**Goals:** one topic documenting the blessed build path end to end, drift-checkable against the plugin/app source it describes.

**Non-Goals:** documenting alternative bundlers; core README changes (this topic is outside the parity set); starting before the prerender pipeline ships.

## Decisions

### D1 — Slug `build-tool` (singular), rewriting the existing entry

Maintainer-named. The entry was to be reused for history, but the old `build-tools` entry (`2GJgubYMdwZokIK2ZRZ3LA`) went with the 2026-09-30 relic cleanup — `push.py` creates `build-tool` fresh (2026-10-02). Old `/docs/build-tools` deep-link support was already declined (consistent with `get-started`).

### D2 — Source of truth is `@loom-js/build` (resolved 2026-10-01)

Maintainer lean (2026-08-30): ship the build story as a new loom package wrapping the esbuild assembly + `esbuild-plugin-html-split` (+ the prerender seam from `server-first-loom-app`) behind a simplified config — if the wrapper genuinely simplifies (the test: a minimal app's config shrinks, with a raw-esbuild escape hatch; if it mostly re-exposes options, it's indirection and the wrapper is dropped).

**Resolved:** the wrapper is `@loom-js/build` (CLI `loom build` / `loom dev` + `loom.config.ts`), proposed as `loom-build-tool`; the plugin publishes as `@loom-js/esbuild-plugin-html-split`. This topic documents the package's config, commands and prerender hooks, with the plugin covered as the raw-esbuild path and pointed at its own README. Drift anchor: `packages/build/src/` and the plugin's option types. Other bundlers (vite, webpack) are future adapters with their own topics; this topic carries one pointer line.

### D3 — Tail placement before `feedback`

Learning path → build-tool → feedback: reference material after concepts, call-to-action last.

## Risks / Trade-offs

- [Written too early, it documents a moving target] → hard-sequenced after `server-first-loom-app`; the tasks open with a "source landed?" gate.

## Open Questions

None (deferred questions belong to the rewrite, once the source exists).
