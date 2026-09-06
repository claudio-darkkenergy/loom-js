# Lazy Content Rename

## Why

`lazyImport` and `importLazy` are word-permutations of each other: the names carry no signal about which resolves any imported value and which resolves renderable content — you memorize it or look it up (maintainer, 2026-09-06, during the lazy-imports draft review). With zero real consumers of `importLazy` in the repo (definition + one type test), the rename is nearly free now and only gets costlier.

## What Changes

- `importLazy` → **`lazyContent`**: family-prefix + role naming — `lazyImport` lazily imports _any value_; `lazyContent` lazily imports _renderable content_ (path-keyed, effect-ready). Signature unchanged: `lazyContent(path, importer?)`.
- `importLazy` remains for one release as a deprecated alias (pre-1.0 courtesy; no known consumers), scheduled for removal in the next cleanup per the standing alias-removal requirement; first-party code (the type test) migrates now.
- Docs: the lazy-imports topic's second section renames, opens with the one-machinery-two-entry-points differentiator, and the bridge sentence gains the naming payoff; README mirrors; **minor** core changeset.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-type-surface`: the "Lazy imports return a typed activity" requirement renames its renderable-content clause to `lazyContent` (alias noted as transitional).

## Impact

- `packages/core/src/lazy-import.ts` (rename + deprecated alias), `tests/types/lazy-import.types.ts` (migrate).
- README + `topics/09-lazy-imports.md` (heading, differentiator, bridge, example).
- `activity-transform-concurrency` unaffected; no sequencing constraints.
