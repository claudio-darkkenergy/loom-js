## 1. Pre-work (SOLID audit + baseline)

- [x] 1.1 Check `SOLID-AUDIT-REPORT.md` for open 🔴 Critical violations in `activity.ts`, `get-text-update.ts`, `context/helpers.ts`, `component.ts`, `helpers.ts`; resolve any before editing (Audit Rule). — Only open 🔴 is in `services/api/log.ts` (not touched); no blockers.
- [x] 1.2 Run `pnpm -F @loom-js/core test-ci` to capture a green baseline before changes. — Baseline: 41 pass; `routing.spec` has a PRE-EXISTING import error (`sanitizeLocation` not exported), unrelated to this change.

## 2. Array-aware change detection in `activity()` (Decisions 2 & 3)

- [x] 2.1 Add a `shallowDiffArray(oldArr, newArr)` helper in `packages/core/src/lib/helpers.ts` (length + positional strict `!==`), mirroring `shallowDiffObject`. Do NOT modify `isObject`.
- [x] 2.2 Extend `resolveCurrentValue` in `activity.ts` to clone arrays (`value.slice()`), keeping plain-object clone and pass-through for other types; remove the now-satisfied `@TODO`.
- [x] 2.3 Add an array branch to `shouldUpdate` gated on `deep`: when both values are arrays and `deep` is set, use `shallowDiffArray`; otherwise keep strict `!==`. Preserve the `forceAtThisMoment` short-circuit.
- [x] 2.4 Verify `value()` returns a reference-isolated copy for arrays (via `resolveCurrentValue`). — Covered by test 5.2.

## 3. Enable keyed reconciliation + correctness fixes (Decisions 4 & 6)

- [x] 3.1 In `packages/core/src/lib/templating/get-text-update.ts`, change `ctxSnapshot.key || i` to `ctxSnapshot.key ?? i`.
- [x] 3.2 ~~Broaden `getContextForValue`'s name check.~~ **REFUTED & reverted.** All component context functions are named exactly `contextFunction` (the strict check already reads mapped items' keys); broadening it would make snapshotting invoke an `activityContextFunction` (no dry-run) and leak a subscription. Kept strict; locked in by test 5.5.
- [x] 3.3 Confirm keyed reuse across a reorder via test 5.3. — **String/stable keys: works** (verified across rotation + full reversal). **Numeric keys: known limitation** (index-keyspace collision via the outer interpolation's re-reconciliation delete); documented, not fixed here (needs finding #3/#4 refactor).

## 4. Remove leftover debug logs (Decision 5)

- [x] 4.1 Remove the `console.log({ templateTagValue })` block (and its `// @Remove` comment) in `activity.ts` `renderEffect`.
- [x] 4.2 Remove `console.log({ currentLiveNode, value, newValue })` in `get-text-update.ts` `textUpdater`.
- [x] 4.3 Remove `scopedCtx && console.log({ scopedCtx })` in `component.ts` `contextFunction`.

## 5. Tests (spec coverage)

- [x] 5.1 Change-detection tests: same-content array update under `deep: true` does NOT re-run effects; changed-content DOES; `force`/`update(value, true)` overrides.
- [x] 5.2 Test that mutating the array returned by `value()` does not corrupt internal state.
- [x] 5.3 Keyed reorder test (string keys): capture element instances, `update()` a reordered/reversed array, assert each key's element instance is the SAME reference. Numeric-key variant added as `it.skip` documenting the follow-up.
- [x] 5.4 ~~Falsy `0` key not collapsed to index.~~ Superseded: numeric/falsy keys are the documented known limitation (the `?? i` fix is correct at the updater level, but the outer re-reconciliation deletes numeric-keyed childCtxs). Kept as `it.skip`.
- [x] 5.5 Test `getContextForValue`: snapshots a component `contextFunction`'s key AND does not execute an `activityContextFunction` (no leaked subscription).
- [x] 5.6 Run `pnpm -F @loom-js/core test-ci` — new array spec: 7 pass, 1 skip; full suite: 48 pass, 0 new failures (only the pre-existing routing import error remains).

## 6. Example app + verify

- [x] 6.1 In `apps/examples/activity-effect-nested-array/src/app.js`, pass `key: color` to each `.map`ped `Div`; set `{ deep: true }` on the activity (`random-array.js`).
- [x] 6.2 Ran the example app (vite, headless Chromium via the run skill). Across a live shuffle: 16/18 nodes were the same DOM instance; 15 keyed nodes moved WITH their color (keyed reuse working); the 1 repaint is the non-keyed single `Div`, and the 2 recreations are the `slice(0,3)` membership change (both correct). Screenshot confirms full render.
- [x] 6.3 Run `pnpm -F @loom-js/core type-check` — clean for changed files (2 pre-existing errors in untouched `simple.ts` / `register-custom-element.ts`).

## 7. Release & conventions

- [x] 7.1 Run prettier so imports/formatting follow `.prettierrc`.
- [x] 7.2 Add a changeset (patch for `@loom-js/core`) at `.changeset/activity-array-node-reuse.md`, incl. the numeric-key known limitation.
- [x] 7.3 `SOLID-AUDIT-REPORT.md`: no violation touched (no update needed). `.claude/skills/skill-config.md`: no convention changes.
- [x] 7.4 Capture remaining follow-ups (numeric keyed reconciliation via the #3/#4 double-reconciliation, `ctxScopes` inheritance, html-parser contextFunction diff, deep array-of-objects compare) — recorded in proposal/design as deferred; separate proposals when picked up.
