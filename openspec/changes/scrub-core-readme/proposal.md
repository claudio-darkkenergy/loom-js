# Scrub & Complete the @loom-js/core README

## Why

`packages/core/README.md` is the canonical API reference for the framework (CLAUDE.md directs any core editor to read it first), and the upcoming loom docs flush-out will source from it — but parts of it have drifted from the code. The activity section documents a one-argument `activity(initialValue)` with a three-member return, while the source is `activity<V, I>(initialValue, transformOrOptions?, options?)` returning seven members; transforms (the idiomatic async-data path that the settlement/dehydration sections _depend on_) are never documented as a concept. Several code examples contain syntax errors that would fail if pasted.

## What Changes

- **Rewrite the Activities section** to match `src/activity.ts`:
    - Full signature `activity<V, I = V>(initialValue, transformOrOptions?, options?)` — document transforms (`({ input, update, value }) => …`; async transform promises tracked by the `settled()` signal) and the `ActivityOptions` (`deep` shallow-diff comparison for objects/arrays, `force`).
    - Complete the Returns shape: add `reset()`, `bind` already covered, `update(input, forceUpdate?)`'s second parameter, `watch` already covered; document `value()`'s shallow-copy semantics and the frozen `initialValue`.
    - Fix stale prose ("initial value … unchanged throughout the life of the activity" describes `initialValue` the property, not the argument semantics) and typos ("introducted").
- **Correct the lifecycle story**: the Components section claims exactly two hooks (`onCreated`, `onRendered`) while the framework ships five (`onBeforeRender`, `onCreated`, `onMounted`, `onRendered`, `onUnmounted`) — the SSR section already references the other three. Document all five with their timing in the Components concept and update the Life Cycles example.
- **Complete the `init` docs**: `AppInitProps` also carries `append` and `globalConfig`, and `root` defaults to `document.body`; the Quick Example has a syntax error (missing comma after `onAppMounted`).
- **Document missing exports** (audit-driven; final list confirmed during apply): `simple()` / `SimpleComponent`, `lazyImport` / `importLazy`, and the remaining config surface worth public documentation (`globalConfig` shape at boot, `appendEvents`). Internal-leaning exports (`canDebug`, `setToken`, `config`) get a deliberate include/exclude decision rather than silence by accident.
- **Fix broken examples**: the `node()` example (`/ => true` malformed comment), the Life Cycles example (`/` line comments), the Activity example (unclosed `<span>`, missing closing brace/paren), inconsistent `${ label }` spacing.
- **General correctness scrub**: verify every documented signature, option, and default against source; refresh stale content (e.g. the `PrerenderSsgWebpackPlugin` bootstrapping example predates the esbuild build story; `npm i -S` flag is obsolete); confirm the Inclusion lines and Feature Highlights still match the export map.

Non-goals: no runtime code changes; no restructuring of the README's overall section order beyond what the additions require; the docs app content (apps/loom) is a separate effort this feeds into.

## Capabilities

### New Capabilities

- `core-readme-accuracy`: the core README documents the package's public API surface completely and accurately — every documented signature matches source, every public export is documented or deliberately excluded, and every code example is syntactically valid.

### Modified Capabilities

<!-- none — this is a documentation-only change; no runtime requirement changes -->

## Impact

- `packages/core/README.md` — the only file that changes.
- No runtime code, no build, no releases (docs-only; still add a changeset if the repo convention versions README-only changes — decided at apply time per changesets config).
- Downstream: the loom docs flush-out (apps/loom) will consume the corrected content.
