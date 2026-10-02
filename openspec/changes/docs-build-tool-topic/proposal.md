# Docs Build-Tool Topic

## Why

The pre-scrub `build-tools` topic was unlinked by the README-parity scope, but the build story is heading toward first-class status: if the esbuild + `esbuild-plugin-html-split` + prerender setup becomes the de-facto way to build a loom app (maintainer direction, 2026-08-30), it deserves its own documented topic. Writing it now would document a moving target — `server-first-loom-app` is about to reshape the build — so this change is deliberately sequenced after that lands.

## What Changes

- The existing entry (`2GJgubYMdwZokIK2ZRZ3LA`) is rewritten as the `build-tool` topic (singular slug, per maintainer): `@loom-js/build` — the config, the `loom` commands, routes and shells, the prerender hooks — with `@loom-js/esbuild-plugin-html-split` as the raw-esbuild path; sourced from the package reality, not the core README.
- It joins the nav's trailing-utility tail (before `feedback`), riding the IA allowance introduced by `docs-feedback-topic`.
- **Blocked on:** `loom-build-tool` landing (the package is the topic's source); `server-first-loom-app` landed 2026-09-15.

## Capabilities

### New Capabilities

- `docs-build-tool-coverage`: the build topic exists, is accurate to the shipped build tooling, and carries the same drift obligation the README topics carry against the core README.

### Modified Capabilities

_None — the trailing-topics IA change belongs to `docs-feedback-topic`._

## Impact

- Contentful: rewrite + re-slug of one entry; `/docs` listing tail.
- Depends on `docs-feedback-topic` (IA allowance, landed) and `loom-build-tool` (content source).
- No app or package code.
