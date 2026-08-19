## 1. Shared bounded wait

- [x] 1.1 Move `boundedWait` from `packages/core/src/hydrate.ts` into `packages/core/src/lib/settlement.ts` (exported), preserving its contract: resolves `false` when the gate settles first, `true` on expiry, `maxWait: Infinity` skips the timer; clear the expiry timer when the gate wins.
- [x] 1.2 Point `hydrate.ts` at the shared helper and confirm the existing hydration specs stay green (`pnpm -F @loom-js/core test-ci`) — extraction only, no behavior change.

## 2. Rewire the server drain (red → green)

- [x] 2.1 Red: add a `tests/server/route-rendering.test.mjs` (or sibling) case where an async activity transform awaits work spanning multiple macrotask hops (e.g. `setTimeout(..., 30)`); assert `renderToString` serializes the landed content, not the fallback. This fails against the markup-quiet drain.
- [x] 2.2 Green: in `renderSettled`, replace the `MAX_DRAIN_PASSES` markup-comparison loop with the settlement gate — capture `settled()` while the render's window scope is open, race it through `boundedWait(gate, maxWait)`, then serialize `body.innerHTML`. Delete `MAX_DRAIN_PASSES`.
- [x] 2.3 Add `maxWait` to `RenderToStringOptions` (default `4000`); on expiry, `console.warn` naming the bound and `getPendingCount()`, mirroring `hydrate`'s message shape, then resolve with the landed markup.

## 3. Bound behavior coverage

- [x] 3.1 Test: a never-settling tracked thenable (async transform awaiting `new Promise(() => {})`) with a small `maxWait` resolves with the landed markup and emits the pending-count warning.
- [x] 3.2 Test: `maxWait: Infinity` disables the bound (settling work still resolves the render; use work that settles to keep the test finite).
- [x] 3.3 Update the `pending:stuck` comment in `tests/server/dehydrate.test.mjs` — the give-up is now the `maxWait` bound, not the drain pass budget — and confirm the suite's drain-dependent cases (route rendering, ssg smoke, dehydrate) pass unchanged.

## 4. Docs and release

- [x] 4.1 Update `renderToString`'s JSDoc: settle policy is the settlement signal bounded by `maxWait`; note untracked async (work outside activity transforms) is invisible to the signal, as documented for `hydrate`. Sync `packages/core/README.md` where it describes the drain.
- [x] 4.2 Run `pnpm -F @loom-js/core type-check`, `type-check-tests`, `test-ci`, and the server test lane; `pnpm format`.
- [x] 4.3 Add a changeset (minor: `renderToString` gains `maxWait`; settle policy tightens onto the settlement signal).
