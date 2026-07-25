## Context

Cleanup of refactor debris in `@loom-js/core` that leaves the package's `type-check` and `test-ci` baselines red. Origin commits: `93736fe` (rename component prop types / unify contextFunction detection) and `4719d67` (revert deprecated routing from core). Because the baseline is already red, real regressions are hard to spot — this change restores a clean baseline. No runtime behavior is intended to change.

Three concrete defects, all verified against the code:

- `tests/unit/routing.spec.ts:2` imports `sanitizeLocation` from `src/routing.ts`; that export was removed in `4719d67`. `routing.ts` no longer defines it; the `describe('sanitizeLocation()')` block (around line 73) and the import are dead.
- `src/simple.ts` imports `SimpleTemplateFunction` from `./types` (nonexistent — only `SimpleComponent` exists) and is not exported from `src/index.ts` nor imported anywhere.
- `src/lib/templating/register-custom-element.ts:64` passes `ComponentProps<Props>` where `ComponentInputProps<Props>` is expected; lines 57–63 hold a leftover `console.log`.

## Goals / Non-Goals

**Goals:**

- `pnpm -F @loom-js/core type-check` → 0 errors.
- `pnpm -F @loom-js/core test-ci` → all spec modules load; routing spec runs its surviving tests.
- Remove leftover debug logging in `register-custom-element.ts`.

**Non-Goals:**

- Re-implementing routing / `sanitizeLocation` or any deprecated routing behavior.
- Reviving `simple` as public API (unless design review says keep — see Decision 2).
- Any change to array/activity reconciliation (covered by the other two changes).

## Decisions

### Decision 1: Remove the stale `sanitizeLocation` test, not the whole spec

Delete only the `sanitizeLocation` import and its `describe`/`it` block from `routing.spec.ts`; keep the rest of the routing spec (it has other tests that currently never run because the module fails to import). This restores coverage rather than deleting it.

- **Alternative:** re-implement `sanitizeLocation`. Rejected — routing was intentionally reverted/deprecated from core; resurrecting it is scope creep and may not be wanted.

### Decision 2: Delete orphaned `src/simple.ts` (default), or fix+export if intended

`simple.ts` is unexported, unused, and imports a nonexistent type. Default action: **delete it** (and its any `simple`-only types). If the maintainer intends `simple` as forthcoming public API, the alternative is to (a) define/rename the type — likely `SimpleComponent` or a new `SimpleTemplateFunction` alias — (b) fix the `ComponentProps`/`ComponentInputProps` usage, and (c) export it from `index.ts` with a test. Because nothing references it today, deletion is the lower-risk, reversible choice (git history preserves it).

- **Open question for the maintainer:** keep `simple` as a planned API, or delete? Default = delete.

### Decision 3: Fix `register-custom-element` to the intended prop type + drop the log

Correct the line 64 call so the value passed matches `ComponentInputProps<Props>` (the type the component factory expects for input props), consistent with how `component()` is invoked elsewhere. Remove the `console.log` block. Verify the custom-element registration path is still exercised by existing tests (`component.spec.ts`) — add a focused test only if none covers instantiation.

- **Care:** `ComponentProps` vs `ComponentInputProps` distinction (input vs resolved props) is load-bearing; match the existing `componentFunction` call contract rather than casting.

## Risks / Trade-offs

- **Deleting `simple.ts` removes a planned API** → Mitigation: it is unexported/unused and in git history; gated on the Decision 2 open question. Default reversible.
- **`register-custom-element` type fix masks a deeper type mismatch** → Mitigation: prefer fixing the call to the correct type over an `as` cast; run the full suite and, if thin, add an instantiation test.
- **Removing routing test reduces coverage of intended behavior** → Mitigation: the behavior (`sanitizeLocation`) no longer exists in core, so there is nothing to cover; the rest of the routing spec is restored (net coverage increases).

## Migration Plan

1. Fix the three defects.
2. `pnpm -F @loom-js/core type-check` → 0 errors.
3. `pnpm -F @loom-js/core test-ci` → all specs load; routing spec green.
4. No changeset unless `register-custom-element` behavior is observably affected (then patch).

## Open Questions

- Keep `simple` as planned public API (fix + export) or delete it? (Default: delete.)
- Is the `routing.ts` deprecation permanent, confirming `sanitizeLocation` should not return?
- `tests/index.ts` — the original bespoke puppeteer + Koa integration harness (custom `suite`/`test` DSL + injectable-window `config.win` seam), superseded by `@web/test-runner` and now broken. **RESOLVED: delete it** (+ the dead `test-pupp` script and the `proxyquire` mocks). `config.win` is confirmed **obsolete** — the injectable-window/SSR seam is being explored fresh (see the `explore` session on SSR/SSG), not resurrected from this file.
