# improve-loom-console — tasks

## 1. Red — specs as failing tests

- [x] 1.1 Add `packages/core/tests/unit/diagnostic-logging.spec.ts`: warn/error pass through with debug off (sinon-spy `console.warn`/`console.error`); info/log/group are no-ops with debug off; enabling a scope emits only that scope's narration; gate state is read at access time (toggle between calls)
- [x] 1.2 Add attribution + shape assertions: `loomConsole.warn` resolves to a bound native (`Function.prototype.bind` product wrapping `console.warn` — assert no custom wrapper frames by checking the returned function's behavior with a spied `console`), and closed-gate methods all resolve to the same shared no-op
- [x] 1.3 Extend `tests/server/settle-policy.test.mjs`: the `maxWait` expiry warning emits without any `setDebug` call (currently the test enables debug to observe it — invert)
- [x] 1.4 Run `pnpm -F @loom-js/core test-ci` — new specs fail, existing suite otherwise green

## 2. Green — core implementation

- [x] 2.1 Rework `src/lib/globals/loom-console.ts`: proxy `get` returns `value.bind(target)` for `warn`/`error` always; for other function props returns `debugIsOn() ? value.bind(target) : noop` (shared no-op); non-function props pass through; drop the `Es6Object` cast and `this === receiver` handling
- [x] 2.2 `src/config.ts` + types: remove `console`, `warn`, `error` from `ConfigDebugAllowable`/`debugAllowable`; export the "debug is on at all, non-production" predicate the proxy consumes; `canDebug` signature unchanged
- [x] 2.3 Sweep call sites: drop `canDebug('warn') &&` prefixes in `get-attr-update.ts` (5 sites); confirm `hydrate.ts`, `dehydrate.ts`, `server.ts` warn sites are unguarded; check for log-then-throw double-reporting
- [x] 2.4 Collapse reactive-update narration: nest the `should update` detail in `set-reactive-updates.ts` under a per-cycle `groupCollapsed` consistent with `html-parser.ts`'s `loom (Updating…)` group (guarded by `canDebug('updates')`)
- [x] 2.5 Run `pnpm -F @loom-js/core test-ci`, `type-check`, `type-check-tests` — all green

## 3. Refactor + verification

- [x] 3.1 Confirm attribution manually in the docs app: with debug off, trigger an attr-misuse warning and verify the DevTools source link points at the bundled call site, not `loom-console.ts`; with `updates` on, verify grouped (not flat) update narration
- [x] 3.2 Update `packages/core/README.md`: warnings always surface; debug scopes list shrinks; note the access-time gate contract (don't cache method references)
- [x] 3.3 Update `.claude/skills/skill-config.md` if the debug-scope conventions it documents change
- [x] 3.4 Add changeset (`@loom-js/core`, minor): always-on warnings, `ConfigDebugAllowable` shrink, attribution fix
- [x] 3.5 `pnpm format:check` and `openspec validate --change improve-loom-console`
