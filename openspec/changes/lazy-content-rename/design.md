# Design — lazy-content-rename

## Context

Both exports live in `lazy-import.ts` over one cache; only naming distinguishes them. The repo's own usage split is instructive: real consumers of `lazyImport` import _values_ (`@loom-js/highlight`'s tokenizer, route-page machinery); `importLazy` — the renderable-content form — has no consumer, partly because nothing about its name says when to reach for it.

## Goals / Non-Goals

**Goals:** names that teach the split; zero behavior change; the rename lands while consumers are zero.

**Non-Goals:** merging the two entry points (their typings differ on purpose); renaming `lazyImport` (its name is accurate).

## Decisions

### D1 — `lazyContent` over `lazyRender`

`lazyRender` (verb) misdirects: the API doesn't render — it imports something you later interpolate; a reader could expect it to perform rendering lazily. `lazyContent` names what resolves — renderable _content_, the docs' established vocabulary ("typed for renderable content", content regions, `TemplateTagValue` "renders in the effect's slot") — and pairs with `lazyImport` as family-prefix + role.

### D2 — Clean rename, no alias

`importLazy` is deleted in the same change that adds `lazyContent` — no deprecated alias, no transition window (maintainer decision, 2026-09-27; supersedes the original transitional-alias plan). Pre-1.0 the package carries no migration support: a rename is a breaking minor, and the old name simply stops existing. An alias would add surface that exists only to be deleted later.

## Risks / Trade-offs

- [An unknown external consumer of `importLazy` breaks on upgrade] → accepted pre-1.0; the changeset names the rename, and the failure is a loud missing-export error, not a silent behavior change.

## Migration Plan

Minor core release; the changeset states the rename as a breaking change.

## Open Questions

None.
