## 1. Groundwork

- [ ] 1.1 Record the `@loom-js/core` bundle baseline (min+gzip, fresh `build-package`) for the 4.2 delta check
- [ ] 1.2 Audit Rule check: `life-cycles.ts` carries a 🟢 SRP entry (mutation observation vs hook factory) — confirm scope note in design D5 satisfies it or update the entry's revisit condition; no 🔴 entries on touched files
- [ ] 1.3 Confirm `MutationObserver` batch semantics assumed by design D1 with a quick wtr harness probe: a same-batch `insertBefore` move yields removed+added records processed in one `domChanged` invocation (pause and update design if not)

## 2. Red — specs first (tdd-workflow)

- [ ] 2.1 Write failing specs: detached component's effect stops re-running on activity update; cascade disposes child-context subscriptions
- [ ] 2.2 Write failing specs: array-reorder move fires no `onUnmounted`, keeps lifecycle registration, keeps receiving updates; later genuine removal still fires `onUnmounted`
- [ ] 2.3 Write failing spec: remount after teardown re-subscribes exactly once

## 3. Green — implementation

- [ ] 3.1 `types.ts`: add internal `teardowns?: Set<Unsubscriber>` to the component-context type
- [ ] 3.2 `activity.ts`: in the first-call branch of `effect`, keep the `reactiveEffect` disposer and register the per-context cleanup (dispose + `scopedActions.delete(ctx)`) into `ctx.teardowns`
- [ ] 3.3 `life-cycles.ts`: collect removal candidates, batch-end `document.contains` filter (design D1), fire `'unmounted'`/deregister/teardown only for genuinely detached roots; `teardownContext` cascade per D3
- [ ] 3.4 Full suite green (`test-ci`) including existing lifecycle, activity-array, and context-persistence specs; `type-check` + `type-check-tests`

## 4. Verification

- [ ] 4.1 Consumer checks: `pnpm -F @loom-js/utils type-check`; `pnpm -F @loom-js/loom type-check` (no new errors vs. current baseline)
- [ ] 4.2 Rebuild core; record min+gzip delta vs. 1.1 baseline
- [ ] 4.3 Browser sanity in the docs app: enter/leave docs repeatedly, confirm topic navigation still fetches once and toggles still work (guards against over-eager teardown of live subscriptions)

## 5. Bookkeeping

- [ ] 5.1 Changeset for `@loom-js/core` (minor), explicitly noting the `onUnmounted` moved-node semantics fix
- [ ] 5.2 `pnpm format` + `format:check` clean
