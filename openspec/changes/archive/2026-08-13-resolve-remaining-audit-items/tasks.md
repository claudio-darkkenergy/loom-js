# Tasks — resolve-remaining-audit-items

## 1. get-attr-update.ts OCP refactor (design D1, D2)

- [x] 1.1 Define `SpecialAttrUpdaterFactory` and convert the `attrs`, `on`, and `props` updaters into typed factory entries in a `specialAttrUpdaterFactories` map, each owning its bind-time state (fresh `bindingRegistry` Map for `attrs`, shared `listenerCtx` collection for `on`) and removing the `as BoundSpecialAttrTemplateNodeUpdate` casts
- [x] 1.2 Convert the `event` and `default` updaters into standalone `eventUpdaterFactory` / `defaultUpdaterFactory` fallbacks (`event` seeds `listenerCtx.eventListener = undefined`)
- [x] 1.3 Replace the `switch(true)` in `getSpecialAttrUpdate` with the map lookup + fallback chain (`specialAttrUpdaterFactories[nodeName] ?? config.events check ?? default`), preserving the attribute-removal cleanup after dispatch
- [x] 1.4 Verify: `pnpm -F @loom-js/core type-check`, `pnpm -F @loom-js/core type-check-tests`, and `pnpm -F @loom-js/core test-ci` all pass
- [x] 1.5 Update the `get-attr-update.ts` entry in `SOLID-AUDIT-REPORT.md` to ✅ Resolved per the `solid-audit` skill conventions (design D6)

## 2. core-baseline-health spec repair (design D5)

- [x] 2.1 Edit `openspec/specs/core-baseline-health/spec.md` directly: add a `## Purpose` section (obligations: core compiles cleanly, tests load and type-check, no debug logging ships) and rename `## ADDED Requirements` to `## Requirements`, leaving all requirement and scenario text untouched

## 3. @loom-js/loom type errors (design D3, D4)

- [x] 3.1 Update `apps/loom/project/client/dev.mts` to destructure `{ hosts, port }` from `ctx.serve(...)` and derive `host` as `hosts[0] ?? 'localhost'`, keeping the `0.0.0.0 → http://localhost` log mapping
- [x] 3.2 Add `declare module '@appwrite.io/pink';` and `declare module '@appwrite.io/pink-icons';` to `apps/loom/src/app/types/declarations.d.ts`
- [x] 3.3 Verify: `pnpm -F @loom-js/loom type-check` exits with zero errors

## 4. Final verification

- [x] 4.1 Run `pnpm format:check` (fix with `pnpm format` if needed) and confirm no unrelated files changed
- [x] 4.2 Confirm `pnpm dev` still serves apps/loom on port 9092 with a sensible logged URL
