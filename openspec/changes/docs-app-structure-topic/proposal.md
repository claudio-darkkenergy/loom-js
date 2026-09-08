# Docs App-Structure Topic

## Why

The docs teach every primitive but never where its files _live_: the Server Rendering review (2026-09-07) surfaced the cost — a reader traced `client.ts` vs `@app/app` vs the server handler into an imagined crash because nothing documents the module-graph shape of a loom app. Aliases (`@app/…`), the browser-only entry, the shared component module, server handlers, prerender scripts, shells: the architecture exists as convention scattered through examples, with no topic naming it (maintainer request, same date).

## What Changes

- A new **app structure** docs topic: the anatomy of a loom app — the shared component tree (`@app/app`, import-safe off-browser), the browser-only entry, server/prerender modules, the shell, static assets, and the directory best practices that follow (module-scope DOM only in the entry; one App module both runtimes import; alias conventions and where they're configured).
- Sourced the pink-map way (no README anchor): a reviewed outline with source pointers into `apps/loom`'s real structure — the reference implementation — and the examples the concept topics already carry.
- Nav placement rides the trailing-utility/grouped-nav machinery (likely beside `build-tool` in the Reference group — grouping review decides).
- **Sequenced after** `server-first-loom-app` (the blessed structure it ships is the thing to document) and the build-package decision (`docs-build-tool-topic` D2 — structure and build docs must tell one story; they may co-author).

## Capabilities

### New Capabilities

- `docs-app-structure-coverage`: the topic exists, matches its reviewed outline, reflects the shipped reference structure, and carries the standing drift obligation (structure-affecting changes touch the topic or record a follow-up).

### Modified Capabilities

_None — nav placement rides existing deltas._

## Impact

- Contentful — one topic entry (slug review-gated; `app-structure` presumed) in the utility tail/group.
- `openspec` — the outline artifact (review gate) with source pointers.
- No code; if outlining exposes structure warts in the reference app, they spawn their own changes.
