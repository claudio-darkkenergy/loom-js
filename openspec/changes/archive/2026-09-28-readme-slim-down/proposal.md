# README Slim-Down

## Why

`packages/core/README.md` is a ~1000-line single-file manual because it had to be: it predates the docs site. Once the README-aligned topics are published and prerendered, the site is the better home for depth — linkable sections, per-topic TOCs, syntax highlighting, learning-path navigation — and the full-manual README becomes a second copy of everything, doubling every future edit under the parity obligation. The maintainer's direction (2026-09-01): the site becomes canonical; the README becomes the front door.

**Sequenced after:** `align-loom-docs-with-core-readme` fully published **and** `server-first-loom-app` landed (prerendered, crawlable topic URLs). Do not start before both — until then the README is loom's only real documentation and the docs' parity anchor.

## What Changes

- `packages/core/README.md` slims to the front door: pitch, feature highlights, install/inclusion, one quick example, and a learning-path section linking each concept to its published topic URL.
- **The anchor direction inverts**: topics stop deriving from README sections; the content map re-anchors topics to their own outlines + source pointers (the pattern `docs-pink-section` D2 establishes for pink), and the README's obligation shrinks to "links resolve, claims match the site."
- `core-readme-accuracy` is re-scoped to the slim surface (signatures gone from the README are no longer its concern; example validity and export coverage move to the docs' coverage spec).
- `docs-content-coverage`'s "README edits propagate" requirement inverts to "core API changes propagate to topics" (the map's source pointers make that checkable without the README middleman).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-readme-accuracy`: re-scoped to the slim README (accuracy of what remains; resolving links to canonical topics; no obligation to carry full API surface).
- `docs-content-coverage`: drift anchor moves from README sections to the content map's outlines + source pointers; propagation requirement re-worded accordingly.

## Impact

- `packages/core/README.md` — the slim rewrite.
- `openspec/specs/core-readme-accuracy/spec.md`, `openspec/specs/docs-content-coverage/spec.md` (as synced by then) — delta rewrites.
- `openspec/changes/align-loom-docs-with-core-readme/content-map.md` (archived by then) — superseded as the README-mapping record; the re-anchored map lives with this change.
- No code. Docs topics unchanged in content — only their anchor bookkeeping moves.
