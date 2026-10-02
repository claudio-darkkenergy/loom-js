# Tasks — stackable-life-cycle-hooks

## 1. Tests first (red)

- [x] 1.1 `tests/unit/component/life-cycles.ts`: component + hook same event (order), two hooks same event, re-render registration is a no-op, event first registered on a later render fires, child + parent-ref both fire (child first)
- [x] 1.2 `unmount-teardown` tests: remount rebuilds the list (two handlers), ref handler survives; existing scenarios still green in intent

## 2. Core

- [x] 2.1 `types.ts`: `LifeCycleHandlerProps` slots become `LifeCycleHandler[]`; public hook/handler/`RefContext` types untouched
- [x] 2.2 `life-cycles.ts`: setters append under the D2 open/lock rule (per-render `registering` set, created before the template function runs); `lifeCycleStateUpdateEffect` runs the list then `ctx.ref?.<event>`; `createLifeCycleHook` group wrapper removed
- [x] 2.3 `teardownContext` clears the lists; `component.ts` stops seeding slots from the `ref`
- [x] 2.4 `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` green

## 3. Docs

- [x] 3.1 `docs/topics/04-components.md`: handlers stack in registration order, the list locks after the registering render, ref handlers run last; remount paragraph updated; push via `docs/contentful-sync/`
- [x] 3.2 Minor changeset for `@loom-js/core` noting the child + ref same-event behavior change

## 4. Consumer check

- [x] 4.1 `apps/loom`: `TopicContent` registers an `onMounted` of its own alongside `useFragmentSync` in a scratch render and both fire — then revert the scratch; `pnpm -F @loom-js/loom type-check`
