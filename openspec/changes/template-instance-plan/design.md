# Design — template-instance-plan

## Context

```
today, per instance:  importNode ──► setUpdatesForPaths ──► per path: resolve node (memo, childNodes[i]) ──► getAttrUpdate | getTextUpdate
                                                                        └─► closure(s): applyValue, listenerCtx, bindings Map, unsubscribe…
                                                                        └─► slotUpdater closure ──► ctx.updaters[i]
                      lifeCycles(ctx) ──► { 5 hook closures } + 5 arrays ; ctx.render = htmlParser.bind(ctx) ; ctx.node = () => …
proposed:             template parse ──► fragment normalized (text split, `$attrs` stripped) ──► plan: steps[] + entries[{ node, kind, name }]
                      instance ──► clone ──► walk steps (firstChild/nextSibling) ──► slots: [{ node, value, state? }]
                      render/re-render ──► for i: changed? ──► apply[kind](slot, value, ctx, i)
```

Measured 2026-10-03 (M1 Max, Chrome 153, 1 000 rows; the full record is in `tasks.md`). `pnpm bench` before: createRows loom 30.9 ms vs vanilla 18.3, replaceAll 36.2 vs 19.7, appendRows 32.0 vs 19.7, clearRows 5.0 vs 1.9, geometric mean 1.96×, heap 4.83 MB vs 0.99.

D0 result. The V8 heap grows 2 756 B per row (JSHeapUsedSize +2 992 B/row). 51 % of it is the per-path wiring — 10 slot-updater closures with their contexts, 6 attribute updaters with their `applyValue` closures and contexts, the event and text updaters, two listener records — 9 % is the hook surface (5 closures, the hooks object, 5 empty handler arrays) and 7 % the `updaters`/`values` arrays. The rest is retained by design (context object and property store, `node`, bound `render`, props copies, the list item, strings, the row datum: ~620 B) or belongs to the activity's binding machinery (`bind` object, `select`/`watch` closures, the subscription's closures, the `teardowns` Set: ~350 B, 13 %). Blink-side DOM and layout memory is another ~10.9 KB/row outside the metric, equal for every framework, except the NodeList + NodeListsNodeData the `childNodes[i]` walk leaves on five elements per row.

The createRows click's script is 15.2 ms (unminified, 100 µs sampling) plus 1.3 ms of mutation-observer microtask and 1.3 ms of GC, next to 17.3 ms of layout. Ranked: path resolution 2.9 ms (memo + `childNodes[i]`), per-path wiring 3.0 (classification 0.9, text split and fragment swap 1.3, special-attribute `removeAttribute` 0.3, closure construction), initial-apply overhead 2.3 (`slotUpdater` dispatch 0.8, `canDebug` per slot 0.5, `appendChildContext` for attribute slots 0.4, text `createTextNode` + `replaceWith` 0.7), `importNode` 1.6, DOM writes 1.4 (`setAttribute` ×6, `addEventListener` ×2, `bindAttr`), mount scan 1.3, hook surface and context setup 1.1, placement `insertBefore` ×1 000 1.0. clearRows: `node.remove()` ×1 000 is 2.8 ms of its 3.3 ms handler, then the unmount scan and a teardown that allocates five handler arrays per row.

Scope extension (after D1–D6 landed at heap 2.50 MB, createRows ~1.3×, replaceAll 1.33×, appendRows 1.37×, clearRows 1.8×, geometric mean ~1.6×). A second pass — one CPU profile per op at 50 µs, plus micro-benchmarks in the same Chrome — found: a keyed pass costs ~0.9 ms per 1 000 unchanged items (swapRows 0.94 ms of script, removeRow 0.89, partialUpdate 1.5 with its 100 re-renders): `handleArrayValue` itself 0.19, `appendChildContext` 0.13 (a `${key}[]` string and a `Map` delete per item), `haveEqualProps` 0.15 (four arrays and two closures per item), the two index maps 0.06, the LIS 0.06, GC 0.10. A fresh instance spends 0.77 µs in `contextFunction` itself, most of it five `delete`s of properties that are not there. The scan's collection per node costs 0.6–0.7 ms per 1 000 row-sized nodes against 0.4 for an element walk, and 0.26 against 0.18 ms for one 6 000-element subtree. clearRows is `replaceChildren` 2.3 ms (1.3 for bare rows in isolation, +0.2 for the observer's transient registrations, +0.1 for listeners), the observer callback 1.06 (scan 0.48, teardown 0.30) and the reconciler 0.5. One hypothesis was rejected: node-list caches left by the scan do not tax later text or attribute writes.

Constraints: no public API or template-syntax change; every observable rule stays — one listener per event per element, one binding subscription per slot (replaced on re-render, torn down on unmount), `bind` skipping unchanged projections, `$attrs`/`$on`/`$props` merge semantics, style replacement semantics, custom-element props, table-content comment markers, fragment roots, hydration's detached-tree rendering, server rendering, what the unmount scan finds (the node itself, then every element under it, in document order).

## Goals / Non-Goals

**Goals:**

- Per-template work (text splitting, special-attribute stripping, path resolution strategy, kind classification, attribute name parsing) happens once per template and document, not per instance.
- Per-instance allocation is the slot array plus whatever state a kind genuinely needs (a listener, a binding unsubscriber, a bindings map for `$attrs`).
- No per-instance hook closures stored on the context, no eager handler arrays, no allocation in teardown.
- A whole-list replacement is one DOM operation.
- A keyed pass allocates nothing per unchanged item; the mount/unmount scan allocates nothing per node; resetting a context never deletes a property.
- Bench: createRows/replaceAll/appendRows < 1.3×, clearRows < 1.4×, heap < 3 MB, geometric mean < 1.5×. Vanilla's layout is ~17 of its 18–20 ms on the creation ops, so 1.3× leaves loom about 5 ms of script for 1 000 rows; clearRows at 1.4× leaves ~0.8 ms over vanilla's one-call clear for the unmount batch and teardown.

**Non-Goals:**

- A build-time compiler or template transform.
- The activity system's model: one subscription record per bound attribute (~350 B) and one effect run per subscriber on every update stay. Only how a reactive proxy finds its own state changes (D10).
- Changing what any hook or attribute does, when a render is skipped, or which nodes a keyed pass moves.
- Replacing the mutation observer as the mount/unmount detector — clearRows's native share (transient registrations on 1 000 removed rows) stays.

## Decisions

### D0 — Re-analyze before building (task 1) — done

Heap snapshot diff (0 → 1 000 rows, after GC) with dominator-based retained sizes per component context, and a CPU profile of the createRows click with inclusive attribution; both over an unminified bundle of `packages/core/src`. Items under 5 % of bytes and of script time were dropped (`ctx.render = htmlParser.bind(ctx)` at 24 B, `ctx.node` at 48 B, `importNode`, the DOM writes, the mount scan); two items over it that the proposal did not list were added: the `childNodes[i]` walk (D1) and the per-node `remove()`/`insertBefore` loops of a whole-list replacement (D6).

### D1 — The plan: fragment normalized and resolved once per template and document

When a document first parses a template, the cached fragment is normalized before any path is computed: every text or comment node holding slot tokens is split in place into static text nodes and one `Text` per token (a table-content comment marker becomes its token text node here — DOM APIs place it where the HTML parser would have foster-parented it), and every special attribute (`$…`) is classified and then removed from its template element. The plan is then compiled from the normalized fragment: `steps: number[][]` — the child-index path of each unique dynamic node, in document order — and `entries: PlanEntry[]` — one per dynamic path, `{ node, kind, name }` where `node` indexes `steps`, `kind` is `text` | `attr` | `event` | `attrs` | `on` | `props` | `custom` (today's precedence: named special attributes, then `config.events`, then the default factory, which sets a custom-element prop or a plain attribute) and `name` is the attribute or event name parsed once. The plan lives on the per-document cache entry next to the fragment. Steps are relative to the previous dynamic node in document order (parent hops, sibling hops, then child indexes), so an instance reaches all of its nodes in one short chain of `parentNode`/`nextSibling`/`firstChild` hops — no `childNodes` access, so no NodeList is allocated per element — then builds its slots over the entries.

_Alternatives rejected:_ keep per-instance classification but cache per `Attr` — the `Attr` is the clone's, new per instance; keep splitting text per instance from a stored layout — the split itself is the cost, and a normalized fragment clones correctly in every DOM implementation.

### D2 — Slots: `{ node, value, state }` per dynamic path

Instance state is `ctx.slots: Slot[]` in entry order, replacing `updaters` and `values`. `node` is the slot's live node (for a text slot, the current node or node list after a list render). `state` is `undefined` for the kinds that need nothing (`props`, `custom`, a plain `attr` until it is bound), the binding unsubscriber for a bound `attr`, the current listener for an `event`, a lazily created registry for `attrs` (bindings per key) and `on` (listeners per event), and, for `text`, the loom-owned `Text` node: a primitive value writes `data` on it instead of creating and replacing a node; an element, node list or user-supplied node replaces it and clears the ownership, and the next primitive creates a fresh owned node. Apply functions are module-level per kind — `applyText`, `applyAttr`, `applyEvent`, `applyAttrs`, `applyOn`, `applyProps`, `applyCustom` — `(slot, entry, value, ctx, index)`, the bodies of today's updater closures with every captured variable moved to `slot.state` or read from the plan entry (`name`, `prop`); the reconciler entry `textUpdater` stays for the activity effect's root. Only text slots resolve a child context (`appendChildContext` with the slot index); attribute kinds never used theirs. Re-render: `hasSlotValueChanged(slot.value, next) && (slot.value = next, apply[kind](slot, next, ctx, i))`, with the per-slot debug narration folded into the render loop's collapsed group. Teardown of binding unsubscribers keeps registering on `ctx.teardowns`.

### D3 — Hook surface — decided: per-render closures, nothing stored

The five hooks are created per render from one factory that closes over `ctx` once (`lifeCycleHooks(ctx)`), spread into the props object the template receives, and not kept on the context: `ctx.lifeCycles` goes away and a render that captures no hook retains none (5 × 28 B + 32 B + 5 × 16 B per instance today). `ctx.render = htmlParser.bind(ctx)` and `ctx.node` stay — 24 B and 48 B, under 1 % each, and a bound tag needs no shared mutable state. Handler arrays (`ctx.created` …) are created on first registration; dispatch reads them with `?.`; `teardownContext` sets them to `undefined` instead of allocating five arrays per unmount. A module-level "rendering context" global is rejected: a hook called after its render (an empty event registered late) must still target its own instance, which only a closure guarantees.

### D4 — Evidence is the bench

Before/after runs in one session; the targets in Goals gate the change; a heap snapshot after confirms the per-row footprint.

### D5 — (dropped, then reopened as D8) mount scan

Measured at 1.3 ms in D0 and left alone: under 5 % and fixed by the `unmount-teardown` spec's one-query-per-node rule. The scope extension reopened it with a direct measurement — see D8.

### D6 — Whole-list replacement and runs of placements are one DOM operation each

In `handleArrayValue`, when no previous item is reused and the previous nodes (or the placeholder) are exactly their parent's children, the pass calls `parent.replaceChildren(fragment)` instead of N `remove()` and M `insertBefore` calls; otherwise consecutive items that need placing before the same following item travel through one fragment and one `insertBefore` (an append of 1 000 is one insertion). Context release, item keys and the LIS placement are otherwise unchanged, and the mutation batches still reach the observer. Measured: clearRows's `remove()` loop was 2.8 ms of a 5.0 ms op, createRows's `insertBefore` loop 1.0 ms. `replaceChildren` exists in Chrome, linkedom, happy-dom and jsdom.

### D7 — A keyed pass allocates nothing per unchanged item

`handleArrayValue` and the render-skip check keep their results and lose their per-item garbage: `haveEqualProps` compares own keys in place (no key arrays, no closures); array-slot contexts move to their own map (`arrayChildren`), so no `${key}[]` key is built and no miss is looked up per item; the pass's key index is kept with its live items and serves the next pass (one `Map` per pass instead of two `Map`s and a `Set`), with the by-node index built only when a key lookup misses; a pass whose reused items arrive in their previous order skips the LIS; a reused item keeps its item record, single nodes are never wrapped in arrays and a one-node run is inserted directly. What moves, what is reused and what is released are unchanged — `keyed-list-diffing` and `render-skip-on-equal-props` are the regression suite.

### D8 — The mount/unmount scan walks elements

`forEachRegistrable` checks the node, then walks its descendant elements with `firstElementChild`/`nextElementSibling` — the collection's document order, no `HTMLCollection` per scanned node. The `unmount-teardown` delta replaces "one element query … never a script-stepped walk": that rule came from replacing a `TreeWalker` per node, and the measurements above put the element walk ahead of the collection in both regimes.

### D9 — Resetting a context assigns, never deletes

`children`, `arrayChildren`, `refs`, `owned` and `registering` are set to `undefined` only when present (in `component` and `teardownContext`): an absent property costs a read instead of a runtime call (five absent `delete`s: ~100 ns per instance, against ~4 ns), and a present one no longer drops the context into dictionary mode — which `delete ctx.registering` did to every instance that registered a hook on its first render. The ref iterator behind `createRef` is opened by its first call.

### D10 — A reactive proxy keeps its state in one record

`reactive` gives each proxy one state record — the effect running against it and its target's dependency sets — that its traps close over and `reactiveEffect` looks up once. An effect run and a tracked read then touch no weak map (they did five weak-map or map operations each, two of them writes), and a read that is already tracked adds nothing. Which effects a read tracks and when they run are unchanged. Measured on the bench's select path, minified: 88 → 70 µs per update over 1 000 subscribers — enough to keep selectRow on the 0.2 ms side of the bench's 0.1 ms timer, which the geometric mean is sensitive to.

## Risks / Trade-offs

- [A kind's closure captured state the slot model forgets] → the per-kind specs (`attr-value-semantics`, `reactive-attr-bindings`, custom-element, `$attrs`/`$on`/`$props`, style) are the regression suite; every captured variable in `get-attr-update.ts` is enumerated into `Slot.state` or the plan entry during task 3.
- [Writing `data` keeps a text node's identity across updates] → only loom-owned nodes are written; a user-supplied `Text` is still placed as given and never mutated; nothing in core or the specs reads a text slot's node identity.
- [Normalizing the cached fragment changes what `importNode` copies] → the clone is what today's wire step produced anyway (split text nodes, stripped special attributes); hydration and server renders operate on clones.
- [Plan cache keyed per document grows] → it lives on the existing per-document `WeakMap` entry.
- [`replaceChildren` on a parent that holds foreign nodes] → the fast path requires the previous nodes to be all of the parent's children; otherwise the per-node path runs as today.
- [A kept key index goes stale] → it is written with the live items at the end of each pass and read only with them; a node list with no stored record builds its index as before.
- [The in-order shortcut misjudges a reorder] → it applies only when every reused item's previous position exceeds the one before it; any inversion falls back to the LIS.
- [The state record changes what a nested or cross-proxy read tracks] → the record is per proxy, as the active-effect map was, and dependency sets stay per target; `reactive-unsubscribe`, the activity specs and the binding specs are the regression suite.
- [A reset by assignment leaves a key behind] → every reader already treats `undefined` as absent (`?.`, `??`, `??=`); nothing enumerates a context's keys.

## Migration Plan

1. D0 analysis; this document and the tasks revised. — done
2. D1 + D2 behind the existing templating specs; new plan specs. — done
3. D3; life-cycle specs. — done
4. D6; keyed-list spec. — done
5. Bench before/after; changeset (patch). — done, gates partly missed
6. Scope extension: second analysis pass, then D7–D9 with their specs; bench again.
7. Archive on the user's word.
8. Rollback: revert; nothing persisted.

## Open Questions

- None — D3's shape (closure per render, nothing stored) was decided from D0's numbers.
