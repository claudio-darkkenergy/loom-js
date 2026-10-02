# Stackable Life-Cycle Hooks

## Why

Each life-cycle hook setter (`onCreated`, `onBeforeRender`, `onRendered`, `onMounted`, `onUnmounted`) keeps only the first handler registered on a context and silently drops every later one (`lifeCycles` in `src/lib/context/life-cycles.ts`). A reusable hook that needs a life-cycle (`useFragmentSync` taking `onMounted`/`onRendered`/`onUnmounted`; `useDocsLayout` taking `onUnmounted`) therefore takes that event away from its host component and from any second hook — and the loss is invisible: no error, no diagnostic, the handler just never fires. Hooks are meant to be reusable in components the author never sees, so this is a composability defect in core, not an app convention problem (maintainer finding, 2026-10-01).

## What Changes

- **Handlers stack**: every call to a life-cycle setter during a component's registering render appends to that event's handler list; the event fires the handlers in registration order. A component and any number of hooks it calls can each register for the same event.
- **The stack locks once registered**: a context's handler list for an event is fixed after the render that registered it, exactly as a single handler is today — a re-render's calls are no-ops, a remount's render registers afresh (the existing `unmount-teardown` contract), and `ref` handlers keep their place after the component's own handlers.
- **No API change**: setters keep their signature and return type; the hooks a component already registers keep working unchanged. `useFragmentSync` needs no edit once this lands.
- Docs: the components topic states that handlers stack and when the stack locks.

## Capabilities

### New Capabilities

- `life-cycle-handler-stacking`: the per-event handler list — registration order, the lock after the registering render, `ref` ordering, and the teardown reset.

### Modified Capabilities

- `unmount-teardown`: "A remount registers fresh life-cycle handlers" widens from one handler to the handler list — the teardown clears the list (keeping `ref` handlers) and the remount's render rebuilds it.

## Impact

- `packages/core/src/lib/context/life-cycles.ts` (`lifeCycles`, `createLifeCycleHook`, `lifeCycleStateUpdateEffect`, `teardownContext`); the `ComponentContextPartial` handler slots in `src/types.ts` become lists.
- `packages/core/tests/unit/component/life-cycles.ts` gains the stacking scenarios; `unmount-teardown` tests adjust to lists.
- `docs/topics/04-components.md` (pushed to Contentful via `docs/contentful-sync/`).
- Consumers: `apps/loom` hooks that take life-cycle setters (`useFragmentSync`, `useDocsLayout`) become safe to combine with host handlers without any edit. No breaking change.
