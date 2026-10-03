# Keyed List Reconciliation Performance

## Why

The benchmarks page puts loom at 8.16× vanilla (geometric mean) against svelte 1.27× / solid 1.28× / vue 1.60× / react 1.96×, and the gap is entirely in keyed lists: partial update 21×, swap 34×, remove 38×, append 7×. Tracing the bench (2026-10-03) found four causes in `@loom-js/core`, one of them a bug that hits every minified consumer build: three sites still detect context functions by `Function.name` (`appendChildContext`, the html-parser's value diff, the style-arg path), so under a minifier without `keepNames` every keyed item loses its persistent context and is rebuilt from scratch on each update. Fixing just that locally took partial update from 60 ms to 11 ms, swap/remove from 58 ms to 32 ms and append from 130 ms to 65 ms; the rest is the reconciler's `findIndex`-per-item scan moving 997 rows for a swap and 998 for a removal, a dry-run render per item per pass just to read its key, and unchanged items re-running their template.

## What Changes

- **Context-function detection uses the kind marker everywhere** — `contextFunctionKind` (the marker set at creation) becomes the only test; the three `Function.name` checks go. A minified build without `keepNames` reuses keyed items exactly like a `keepNames` build.
- **Keyed reconciliation becomes an O(n) diff with minimal moves** — old items are indexed by key once per pass; items whose relative order is unchanged (a longest-increasing-subsequence of old positions) stay put, only the others move. A swap moves 2 nodes, a removal moves 0, an append inserts only the new nodes. Items whose keys vanished are removed and their child contexts released from the parent's `children` map (today they accumulate forever).
- **Keys are read without a render** — a component context function carries its `key` as a property set at creation; the reconciler reads it instead of dry-running the component (which allocates a full context per item per pass). The dry-run path stays for the existing snapshot API.
- **Unchanged keyed items skip their render** — an item whose props are shallow-equal to its last render (same `children` reference) returns its live root without re-running the template. Rows untouched by a partial update cost a key lookup and a props compare, nothing else. The rule is documented in the Components topic.
- **The bench is the acceptance gauge** — `pnpm bench` after the change must show loom's geometric mean under 2× vanilla with every op under 3× (today 8.16× / up to 38×).

## Capabilities

### New Capabilities

- `context-function-identity`: how core recognizes its own context functions — by marker, minification-safe, no `Function.name`.
- `keyed-list-diffing`: the keyed reconciliation algorithm — key index, minimal moves, removal and context release, key read without rendering.
- `render-skip-on-equal-props`: when a component instance re-render is skipped and what still forces one.

### Modified Capabilities

- `activity-array-reactivity`: "Context snapshotting must not execute non-snapshotable values" becomes a key-read requirement (no invocation of either kind); "Reordered keyed items reuse their own DOM node" gains the minimal-move guarantee.
- `reactive-attr-bindings`: a binding update whose projection is unchanged writes nothing (added during apply — see design D7).

## Impact

- `packages/core/src/lib/context/helpers.ts` (detection, `appendChildContext`, key read), `packages/core/src/html-parser.ts` (value diff), `packages/core/src/lib/templating/get-attr-update.ts` (style arg), `packages/core/src/lib/templating/get-text-update.ts` (`handleArrayValue` rewrite), `packages/core/src/component.ts` (key property, props-equal skip), `packages/core/src/types.ts`.
- `packages/core/tests/**`: new specs for minified detection, diff moves, context release, render skip; existing array/lifecycle specs must stay green.
- `docs/topics/04-components.md` and `05-element-syntax.md` (re-render rule, key semantics); `docs/content-map.md`.
- Changeset: minor `@loom-js/core` (a behavior addition — render skipping — plus the fix).
- `apps/bench` is unchanged; its numbers are the before/after evidence.
