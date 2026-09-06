# Design — lazy-content-rename

## Context

Both exports live in `lazy-import.ts` over one cache; only naming distinguishes them. The repo's own usage split is instructive: real consumers of `lazyImport` import _values_ (`@loom-js/highlight`'s tokenizer, route-page machinery); `importLazy` — the renderable-content form — has no consumer, partly because nothing about its name says when to reach for it.

## Goals / Non-Goals

**Goals:** names that teach the split; zero behavior change; migration cost paid while consumers are zero.

**Non-Goals:** merging the two entry points (their typings differ on purpose); renaming `lazyImport` (its name is accurate).

## Decisions

### D1 — `lazyContent` over `lazyRender`

`lazyRender` (verb) misdirects: the API doesn't render — it imports something you later interpolate; a reader could expect it to perform rendering lazily. `lazyContent` names what resolves — renderable _content_, the docs' established vocabulary ("typed for renderable content", content regions, `TemplateTagValue` "renders in the effect's slot") — and pairs with `lazyImport` as family-prefix + role.

### D2 — Transitional alias, removal scheduled

`export const importLazy = lazyContent` with an `@deprecated` tag naming the replacement; removed next cleanup, honoring the alias-removal requirement's spirit (first-party migrates in this change, so only the alias itself remains to delete). Zero known consumers makes immediate removal defensible, but the alias costs one line and protects unknown externals for one cycle.

## Risks / Trade-offs

- [Docs/README drift during the alias window] → docs mention only `lazyContent`; the alias exists solely in code + changeset.

## Migration Plan

Minor core release; changeset carries the one-line migration (`importLazy` → `lazyContent`).

## Open Questions

None.
