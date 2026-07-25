## Why

`@loom-js/core` does not currently type-check cleanly, and its test suite cannot fully load — both due to leftover debris from an earlier refactor (`93736fe` rename component prop types; `4719d67` "Revert deprecated routing from core"). This masks real regressions: a broken baseline means `pnpm -F @loom-js/core type-check` and `test-ci` always report errors, so new breakages are easy to miss (as seen while landing `fix-activity-array-node-reuse`, where the routing spec import error and two type errors were pre-existing noise).

Confirmed issues:

1. **Stale routing test.** `tests/unit/routing.spec.ts` imports `sanitizeLocation` from `src/routing.ts`, but that export was removed in `4719d67`. The bad import makes the entire `routing.spec.ts` module fail to load.
2. **Orphaned `simple.ts`.** `src/simple.ts` imports a nonexistent type `SimpleTemplateFunction` from `./types` (only `SimpleComponent` exists) and is not exported from `src/index.ts` nor imported anywhere — dead code that emits `TS2724`/`TS2322`.
3. **`register-custom-element.ts` type error + debug log.** Line 64 passes `ComponentProps<Props>` where `ComponentInputProps<Props>` is expected (`TS2345`), and lines 57–63 contain a leftover `console.log({ _children, _scope, ... })`.

## What Changes

- **Remove the stale `sanitizeLocation` test** from `tests/unit/routing.spec.ts` (and its import), so the routing spec module loads and its remaining tests run. `sanitizeLocation` no longer exists in core (routing was deprecated/reverted); the test covers removed behavior.
- **Delete the orphaned `src/simple.ts`** (dead code, broken type, unexported, unused). If it is intended future API, the alternative is to fix its type import to an existing type and export it — to be decided in design; default is removal.
- **Fix the `register-custom-element.ts` type error** at line 64 (align `ComponentProps` vs `ComponentInputProps`) and **remove the leftover `console.log`**.
- **Make the test project type-check.** `tsconfig.spec.json` added mocha types but never `include`d `tests/`, so no tsconfig covered the specs and editors reported `Cannot find name 'describe'/'it'`. It now includes `tests` (`rootDir: "."`). This surfaces ~13 latent test-file type errors (implicit-any, possibly-undefined, missing `proxyquire`/`Config.win`, the stale `sanitizeLocation` import) that were never checked — fix them and add a CI `type-check-tests` script so they can't regress.
- **Result:** `pnpm -F @loom-js/core type-check` passes with 0 errors, the test project (`tsconfig.spec.json`) type-checks cleanly, and `pnpm -F @loom-js/core test-ci` loads all spec files (no import failures).

Non-goals: re-implementing routing/`sanitizeLocation`, reviving `simple`, or any runtime behavior change.

## Capabilities

### New Capabilities

- `core-baseline-health`: The `@loom-js/core` package type-checks cleanly and its test suite loads without stale-import failures — a green baseline that makes new regressions detectable.

## Impact

- **Code:** `packages/core/tests/unit/routing.spec.ts` (remove stale test + import), `packages/core/src/simple.ts` (delete, or fix+export), `packages/core/src/lib/templating/register-custom-element.ts` (type fix + log removal). Possibly `packages/core/src/types.ts` if the `simple` type is kept.
- **Risk:** Low — removes dead code and a test of removed behavior; the one behavioral surface (`register-custom-element`) is corrected to the intended type. No public API change (`simple` is not exported).
- **Release:** No changeset required if only tests/dead-code/types change and no published surface moves; add a patch changeset only if `register-custom-element` behavior is observably affected.
- **Verification:** `type-check` (0 errors) + `test-ci` (all specs load; routing spec runs its remaining cases).
