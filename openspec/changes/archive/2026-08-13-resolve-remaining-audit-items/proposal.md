# Resolve Remaining Audit Items

## Why

Three known-debt items are still on the books from prior baseline work: the open OCP audit entry for `get-attr-update.ts` (the file has since grown to 514 lines, making the two-edit dispatch problem worse), the `core-baseline-health` spec that was archived in raw delta format with no Purpose section, and three pre-existing type errors that keep `pnpm -F @loom-js/loom type-check` red — masking any new errors the app might accrue.

## What Changes

- Refactor `packages/core/src/lib/templating/get-attr-update.ts` to replace the `switch(true)` dispatch in `getSpecialAttrUpdate` with a lookup on a dispatch map of per-key updater factories, so new special attribute types (`$ref`, `$key`, `$bind`, …) extend the map without touching dispatch logic. Behavior-preserving; closes the open 🟡 OCP entry in `SOLID-AUDIT-REPORT.md`.
- Repair `openspec/specs/core-baseline-health/spec.md` in place: add the missing `## Purpose` section and normalize the delta-format `## ADDED Requirements` header to `## Requirements` (no requirement content changes — formatting/normalization only, done as a direct edit rather than a spec delta).
- Fix the three pre-existing `@loom-js/loom` type errors:
    - `project/client/dev.mts:15` — esbuild's `ServeResult` no longer has `host`; it exposes `hosts: string[]`. Update the destructure and the logged URL.
    - `src/app/bootstrap.ts:1-2` — `@appwrite.io/pink` and `@appwrite.io/pink-icons` are CSS-only packages (`main` points at a `.css` file, no type declarations), so their side-effect imports fail under TS 7 (`TS2882`). Add ambient module declarations to the app's existing `src/app/types/declarations.d.ts`.
- Update the `SOLID-AUDIT-REPORT.md` entry for `get-attr-update.ts` to ✅ Resolved once the refactor lands.

## Capabilities

### New Capabilities

- `app-baseline-health`: The `@loom-js/loom` app workspace type-checks cleanly — `pnpm -F @loom-js/loom type-check` exits with zero errors, third-party CSS-only packages have ambient declarations, and build scripts track the esbuild API they compile against.

### Modified Capabilities

<!-- none — the core-baseline-health edit is a formatting repair (Purpose section + header normalization), not a requirement change; the get-attr-update refactor is behavior-preserving implementation work already covered by existing specs -->

## Impact

- `packages/core/src/lib/templating/get-attr-update.ts` — internal refactor on the attribute-update hot path; no public API change. Guarded by the existing core test suite (`pnpm -F @loom-js/core test-ci`), including the reactive attr-binding specs.
- `apps/loom/project/client/dev.mts`, `apps/loom/src/app/types/declarations.d.ts` — app-only fixes; dev server behavior unchanged.
- `openspec/specs/core-baseline-health/spec.md` — documentation normalization only.
- `SOLID-AUDIT-REPORT.md` — one entry moves to ✅ Resolved.
- No dependency, release, or CI changes.
