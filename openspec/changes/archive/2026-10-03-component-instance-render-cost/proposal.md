# Component Instance Render Cost

## Why

After `keyed-list-reconciliation-perf` the bench puts loom at 2.18× vanilla (geometric mean) with every reconciliation op under 2×; what remains is the cost of rendering and tearing down each component instance: createRows 2.23×, replaceAll 2.31×, clearRows 2.79×, and 9.25 MB of heap for 1 000 rows against vanilla's 1.04 MB. CPU profiles of the bench app (2026-10-03) put almost all of loom's extra creation time in slot wiring — one `reactiveEffect` with dependency tracking through the `ctx.values` Proxy per dynamic path (≈9 per row, 9 000 effects per createRows, each with a memberships `Set` and dependency `Set`), plus a `reactive` proxy and effect per instance for life-cycle state — while applying the values themselves (`setAttribute`, `replaceWith`) is a few milliseconds. Clearing is bounded by the unmount observation: a `TreeWalker` per removed row, teardown, and the garbage those structures leave.

## What Changes

- **Slots update through a plain updater list** — a render builds one updater per dynamic path and calls it; a re-render diffs each new interpolation against the previous one with the same change predicate as today and calls that slot's updater directly. No per-slot reactive effect, no values Proxy, no dependency bookkeeping. Observable behavior is unchanged: a slot updates exactly when its value changed by the existing predicate.
- **Life-cycle state dispatches directly** — the per-instance `reactive` proxy and `reactiveEffect` give way to a dispatcher that runs the event's handlers (then the ref's) when the state changes, and does nothing when the same state is set again.
- **The mount/unmount walk gets cheaper** — added and removed subtrees are scanned for registered roots through one DOM query per node instead of a `TreeWalker` stepped from script, and nothing is scanned when no context is registered.
- **Per-instance collections allocate on first use** — `children`, `refs`, `teardowns` and the per-render `registering` set exist only once something is put in them.
- **The bench is the acceptance gauge** — `pnpm bench` after the change shows loom's geometric mean under 2× vanilla with every op under 3×; an op whose vanilla median is under 1 ms is judged on the absolute gap (within 0.2 ms) since the 0.1 ms timer floor makes its ratio meaningless. Heap for 1 000 rows is recorded before and after.

## Capabilities

### New Capabilities

- `template-slot-updates`: how a rendered instance applies interpolation changes — one updater per dynamic path, diffed directly on re-render by the change predicate, no reactive subscription per slot.
- `life-cycle-dispatch`: how life-cycle state reaches handlers — direct dispatch on state change, no re-fire on an unchanged state, ref handlers after the component's own.

### Modified Capabilities

- `unmount-teardown`: the detection requirement names the scan shape — registered roots inside added and removed subtrees are found with one query per node, and an empty registry skips the scan.

## Impact

- `packages/core/src/html-parser.ts` (values diff loop replaces the Proxy), `src/lib/templating/set-reactive-updates.ts` (becomes the slot-updater builder), `src/lib/context/life-cycles.ts` (dispatcher, scan), `src/component.ts` (lazy collections), `src/lib/context/helpers.ts` (`getShareableContext`), `src/types.ts` (`ComponentContext.values`, `lifeCycleState`, optional collections).
- `packages/core/tests/**`: new specs for slot updates and dispatch; every life-cycle, teardown, hydration and diagnostics spec must stay green.
- `apps/bench` unchanged; its numbers are the before/after evidence.
- Changeset: patch `@loom-js/core` — internal mechanics, no API or behavior change.
