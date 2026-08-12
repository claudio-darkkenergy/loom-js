## 1. Groundwork

- [x] 1.1 Record the current `@loom-js/core` bundle baseline (min+gzip from a fresh `pnpm -F @loom-js/core build-package`) for the delta check in 4.2
- [x] 1.2 Check `SOLID-AUDIT-REPORT.md` for open entries on `reactive.ts`, `activity.ts`, `router.ts` (Audit Rule; none known for `reactive.ts` — `router.ts`'s SRP entry is already ✅ Resolved)

## 2. Red — specs first (tdd-workflow)

- [x] 2.1 Write failing unit specs for `reactiveEffect` disposal in `packages/core/tests/unit/` (stop-on-dispose, idempotent double-dispose, dispose-during-trigger of self and sibling, no re-track after dispose)
- [x] 2.2 Write failing unit specs for `activity.watch` unsubscribers (unsubscribed watcher stops; sibling watcher unaffected and fires exactly once per update)
- [x] 2.3 Write failing unit specs for `watchRoute` returning a working unsubscriber (route update no longer invokes handler)

## 3. Green — implementation

- [x] 3.1 `reactive.ts`: add per-effect membership tracking and a returned `dispose()` with the disposed-flag guard (design D1/D2); export the `Unsubscriber` type from `types.ts` (D3)
- [x] 3.2 `activity.ts`: return the dispose function from `watch`; extend its JSDoc to state the `watch` (caller-managed) vs `effect` (context-managed) boundary
- [x] 3.3 `router.ts`: return the forwarded unsubscriber from `watchRoute` (Router method and module export)
- [x] 3.4 Full suite green: `pnpm -F @loom-js/core test-ci`; type checks: `pnpm -F @loom-js/core type-check` and `type-check-tests`

## 4. Verification

- [x] 4.1 Confirm no consumer regressions: `pnpm -F @loom-js/loom type-check` (no new errors vs. baseline) and `pnpm -F @loom-js/utils type-check`
- [x] 4.2 Rebuild `@loom-js/core` and record the min+gzip delta vs. the 1.1 baseline in the PR/commit notes (expect single-digit bytes)

## 5. Bookkeeping

- [x] 5.1 Add a changeset for `@loom-js/core` (minor — additive public API: `watch`/`watchRoute` return values, `Unsubscriber` type)
- [x] 5.2 Run `pnpm format` and confirm `pnpm format:check` passes
