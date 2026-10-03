# Template Instance Plan

## Why

Two perf changes brought loom's bench from 8.2× to ~2.0× vanilla (geometric mean), but instance creation still places last: createRows 30 ms against 17–20 for every other framework, appendRows 33 vs 20–23, replaceAll 36 vs 20–23, clearRows 5.2 vs 2–3, and 5.1 MB of heap for 1 000 rows against 2–3 MB (vanilla 1.0). The profiles point at the same shape each time: every instance builds its template wiring from scratch — a closure per dynamic path (attribute, text, event and special-attribute updaters each carrying their own state), a `lifeCycles` object with five hook closures and five handler arrays, a bound renderer, a `node` getter and a props copy — about 4 KB of closures per row that Svelte and Solid do not allocate, because their compiled templates hold the wiring once and keep only node references per instance.

This change moves loom to that shape without a compiler: a template compiles once into a static plan — for each dynamic path, how to reach its node from the clone and which kind of update applies — and an instance keeps only its node references and last values. Updating is a generic `(node, value, state)` call per kind, shared by every instance of every template.

## What Changes

- **Analysis pass first** — before any code, a heap-snapshot breakdown (constructor and closure counts per 1 000 rows) and a fresh CPU profile of createRows confirm or revise the per-instance inventory below; the design's decisions are adjusted to what the measurements say and the tasks re-cut accordingly.
- **Templates compile to a plan once** — at first parse (per template, per document), each dynamic path is resolved to a node-reaching step list and classified as `text`, `attr`, `event`, `attrs`, `on`, `props` or `custom`; the fragment is normalized at the same time (token text nodes split, special attributes stripped) and the plan lives next to it.
- **Instances hold slots, not closures** — an instance's dynamic state is an array of `{ node, value, state? }` slots in plan order; the render applies values through shared per-kind update functions that take the slot, so no per-path closure exists. Bindings, listeners and style application keep their observable behavior (one listener per event per element, one binding per slot, `bind` skipping unchanged projections).
- **Per-instance life-cycle surface is not stored** — the five hook functions are created per render for the props object and kept nowhere, instead of five closures stored on each context; handler arrays are created on first registration and teardown allocates nothing.
- **A whole-list replacement is one DOM operation** — when a reconciled array keeps no previous item and its nodes are all of their parent's children, the pass calls `replaceChildren` once instead of removing and inserting node by node (the analysis found clearRows's per-node `remove()` loop to be most of that op).
- **The bench is the acceptance gauge** — createRows, replaceAll and appendRows under 1.3× vanilla; clearRows under 1.4×; heap for 1 000 rows under 3 MB; geometric mean under 1.5×; nothing regresses past its current ratio.

## Capabilities

### New Capabilities

- `template-instance-plan`: a template's dynamic wiring is computed once per template and shared by its instances; an instance keeps node references and values only.

### Modified Capabilities

- `template-slot-updates`: "Each dynamic path has one updater" becomes "each dynamic path has one slot" — the updater is a shared per-kind function, not a per-instance closure; the change-predicate requirement is unchanged.
- `life-cycle-handler-stacking`: handler lists exist from the first registration, not from instance creation; stacking, locking and the "first registered on a later render" rule are unchanged.
- `keyed-list-diffing`: replacing every item of a list is one `replaceChildren` call; reorders, removals and appends keep the per-item path.

## Impact

- `packages/core/src/html-parser.ts` (fragment normalized and plan compiled at parse, slot array per instance), `src/lib/templating/get-paths.ts` → the plan compiler, `set-updates-for-paths.ts`/`slot-updater.ts`/`get-live-text-nodes.ts`/`get-dynamic-element.ts` → removed, `get-attr-update.ts` and `get-text-update.ts` → per-kind apply functions taking a slot (plus the whole-list fast path in `handleArrayValue`), `src/lib/context/life-cycles.ts` (per-render hooks, lazy handler arrays), `src/component.ts`, `src/types.ts` (`ComponentContext.updaters`/`values` → `slots`, `lifeCycles` removed).
- `packages/core/tests/**`: new specs for the plan; every templating, binding, event, custom-element, life-cycle, hydration and server spec stays green.
- Changeset: patch `@loom-js/core` — internal mechanics, no API or behavior change.
