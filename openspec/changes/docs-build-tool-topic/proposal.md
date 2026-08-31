# Docs Build-Tool Topic

## Why

The pre-scrub `build-tools` topic was unlinked by the README-parity scope, but the build story is heading toward first-class status: if the esbuild + `esbuild-plugin-html-split` + prerender setup becomes the de-facto way to build a loom app (maintainer direction, 2026-08-30), it deserves its own documented topic. Writing it now would document a moving target — `server-first-loom-app` is about to reshape the build — so this change is deliberately sequenced after that lands.

## What Changes

- The existing entry (`2GJgubYMdwZokIK2ZRZ3LA`) is rewritten as the `build-tool` topic (singular slug, per maintainer): the app build entrypoints (tsx-driven esbuild), `htmlSplit` (routes, shells, dynamic chunks), and the prerender pipeline as shipped by `server-first-loom-app` — sourced from the plugin/app reality, not the core README.
- It joins the nav's trailing-utility tail (before `feedback`), riding the IA allowance introduced by `docs-feedback-topic`.
- **Blocked on:** `server-first-loom-app` landing; revisit then.

## Capabilities

### New Capabilities

- `docs-build-tool-coverage`: the build topic exists, is accurate to the shipped build tooling, and carries the same drift obligation the README topics carry against the core README.

### Modified Capabilities

_None — the trailing-topics IA change belongs to `docs-feedback-topic`._

## Impact

- Contentful: rewrite + re-slug of one entry; `/docs` listing tail.
- Depends on `docs-feedback-topic` (IA allowance) and `server-first-loom-app` (content source).
- No app or package code.
