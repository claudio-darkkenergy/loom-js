# add-client-hydration — tasks

## 1. Settlement tracking (the primitive)

- [x] 1.1 TDD: per-window pending counter — `activity.update()` detects a thenable transform return, increments on start, decrements on resolve _and_ reject; counter state scoped through the provider seam (spec: "Rejected async work still settles"; design D2).
- [x] 1.2 TDD: `settled()` export — resolves on pending-count zero-crossing confirmed by one macrotask of quiet; sync apps resolve after at most one macrotask; chained imports awaited to quiescence (spec scenarios under "settled signal"; design D3). Finalize the export name against the public surface.
- [x] 1.3 Verify zero-cost sync path: no allocation on transform-less/sync updates; confirm concurrent server renders can't cross-talk the counter (per-window isolation test alongside the existing server-rendering isolation spec).

## 2. The hydrate entry

- [x] 2.1 TDD: `hydrate({ app, root, globalConfig, onAppMounted })` — off-DOM render, root children untouched pre-swap, single `replaceChildren` swap after `settled()` (spec: "defers takeover to a single atomic swap"; design D1, D6). Factor shared bootstrap out of `init` without behavior change.
- [x] 2.2 TDD: `ready` gate — swap awaits `Promise.all([settled(), ready])` (design D5).
- [x] 2.3 TDD: `maxWait` bound — default 4000 ms, swap-anyway + `loomConsole` warning naming pending count, `Infinity` opt-out (design D4).
- [x] 2.4 TDD: empty-root degradation — same deferred path, no behavioral fork (spec scenario).

## 3. Lifecycle & pre-swap semantics

- [x] 3.1 TDD: `onCreated`/`onRendered` fire during off-DOM render; `onMounted` fires at the swap (observer started before swap); `onAppMounted` after (spec: "Lifecycle timing matches real DOM attachment"; design D6).
- [x] 3.2 Test the D7 exposure: an effect update landing pre-swap (detached tree fails the `html-parser.ts` containment check) — assert correct final DOM and no observable lifecycle double-fires; if breakage surfaces, apply D7's named fallback (teach the containment check about the hydrate container) rather than removing the check.

## 4. Budget & integration

- [x] 4.1 Measure the byte cost: hydrate entry (tree-shaken out of an `init`-only bundle — verify) and the always-on `activity.update` instrumentation; record against the change's budget in the design findings.
- [x] 4.2 End-to-end proof: `renderToString` a routed app with lazy content → serve the markup → `hydrate` in a browser test → assert no intermediate fallback ever attaches and the final DOM matches the server markup.
- [x] 4.3 `pnpm -F @loom-js/core type-check` + `type-check-tests` + full `test-ci` green.

## 5. Docs & release

- [x] 5.1 `packages/core/README.md`: hydration section — `renderToString` → `hydrate` as the pre-rendering story; document the D2 tracking boundary (async transforms are tracked; raw fetch/timers need `ready`), `maxWait`, and pre-swap inertness (native anchors still navigate).
- [x] 5.2 Update `openspec/specs/server-rendering/spec.md` Purpose line at archive time (hydration no longer purely future) — archive-phase note, no requirement change.
- [x] 5.3 Changeset: `@loom-js/core` minor. Check `.claude/skills/skill-config.md` — new public API (`hydrate`, `settled`) may warrant a convention note.
