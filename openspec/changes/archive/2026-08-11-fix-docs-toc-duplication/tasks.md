## 1. Red — failing regression specs (tdd-workflow)

- [x] 1.1 Check `SOLID-AUDIT-REPORT.md` for open 🔴 violations in `packages/core/src/lib/context/helpers.ts`, `packages/core/src/lib/templating/get-text-update.ts`, and `packages/core/src/activity.ts`; resolve any before touching them
- [x] 1.2 Add a spec file under `packages/core/tests` covering the delta spec scenarios: an `activity.effect` wrapping a component with an array slot (including a nested array item and nested `activity.effect` items), asserting stable DOM identity, single subtree, single subscription per effect across repeated `update()` calls, and kind-change context drop
- [x] 1.3 Run `pnpm -F @loom-js/core test-ci` and confirm the new specs fail for the expected reason (duplication / identity churn), while the existing suite still passes

## 2. Green — core fix

- [x] 2.1 Add the `Array.isArray(value)` branch to `appendChildContext` (persistent context under the `` `${key}[]` `` keyspace, cross-deleting the stale other-kind entry per design D2)
- [x] 2.2 Confirm `handleArrayValue` and `set-reactive-updates` now receive the persistent context end-to-end (no code change expected beyond 2.1 per design D1/D3; if one proves necessary, pause and update design.md first)
- [x] 2.3 Run `pnpm -F @loom-js/core test-ci`, `type-check`, and `type-check-tests` — new and existing specs all green

## 3. Refactor + app cleanup

- [x] 3.1 Refactor pass on the touched core files (naming, comment accuracy — e.g. the stale-context comment in `appendChildContext` now has three kinds to describe) with tests kept green
- [x] 3.2 Remove debug leftovers from `apps/loom/src/app/pages/docs/components/DocContainer/DocContainer.ts` (`console.log({ newChildren })`, scratch `// 2a/2b` comments)

## 4. Verification + release bookkeeping

- [x] 4.1 Verify in the running app (`pnpm dev`, docs page): repeated TOC toggles via the action-bar end icon produce no duplicated `docs-container`, TOC opens/closes correctly at desktop and mobile widths
- [x] 4.2 Update the `activity-array-reactivity` entries per the delta spec if verification exposed gaps; otherwise no-op
- [x] 4.3 Add a patch changeset for `@loom-js/core` (`pnpm changeset`) describing the array-slot context persistence fix
- [x] 4.4 Run `pnpm format` and confirm `pnpm format:check` passes
