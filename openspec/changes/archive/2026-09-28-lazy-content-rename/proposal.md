# Lazy Content Rename

## Why

`lazyImport` and `importLazy` are word-permutations of each other: the names carry no signal about which resolves any imported value and which resolves renderable content — you memorize it or look it up (maintainer, 2026-09-06, during the lazy-imports draft review). With zero real consumers of `importLazy` in the repo (definition + one type test), the rename is nearly free now and only gets costlier.

## What Changes

- `importLazy` → **`lazyContent`**: family-prefix + role naming — `lazyImport` lazily imports _any value_; `lazyContent` lazily imports _renderable content_ (path-keyed, effect-ready). Signature unchanged: `lazyContent(path, importer?)`.
- **BREAKING** — `importLazy` is removed outright: no alias, no deprecation window. First-party code (the type test) moves to `lazyContent` in the same change.
- Docs: the lazy-imports topic's second section renames, opens with the one-machinery-two-entry-points differentiator, and the bridge sentence gains the naming payoff; README mirrors; **minor** core changeset.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-type-surface`: the "Lazy imports return a typed activity" requirement renames its renderable-content clause to `lazyContent`; `importLazy` leaves the surface.

## Impact

- `packages/core/src/lazy-import.ts` (rename), `tests/types/lazy-import.types.ts` (renamed usage).
- README + `topics/09-lazy-imports.md` (heading, differentiator, bridge, example).
- `activity-transform-concurrency` unaffected; no sequencing constraints.
