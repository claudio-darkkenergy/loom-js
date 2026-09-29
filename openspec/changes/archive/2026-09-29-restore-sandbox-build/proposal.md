# Restore Sandbox Build

## Why

`apps/sandbox` no longer builds or type-checks. It sits outside the pnpm workspace, so nothing is installed for it, and its source still targets a core API from several releases ago. The drift went unnoticed until `route-search-params` removed an export the sandbox imported. A scratch app that cannot run is no use for trying core changes against a real build.

## What Changes

- `apps/sandbox` rejoins the pnpm workspace, so `pnpm install` resolves its `workspace:*` dependencies and turbo runs its `build`, `dev` and `type-check`.
- Source moves to the current `@loom-js/core` API: `routes/pages.ts` renders through `locationEffect` in place of the removed `router`, `onRouteUpdate` and `sanitizeLocation`; `onRoute` becomes `route`, the removed `ComponentProps` and `SimpleComponent` types are replaced, and activity value types match the current signatures.
- `@loom-js/tags` no longer exists. Its uses (`Button`, `Img`, `Div`) become plain template markup or core element components.
- Build scripts run through `tsx`, as `apps/loom` does, instead of `ts-node/esm`. `dev.mts` reads esbuild's current `ServeResult` (`hosts`, not `host`).
- Dead files go: the unrouted `event-dashboard` page (a copy of the core page), the empty `core/reactivity/live-node-array.ts`, and the `./mocks` copy rule that points at a folder that does not exist.
- Unused dependencies are dropped from the sandbox manifest.
- The `/core` and `/lazyload` pages fetch photos from `jsonplaceholder.typicode.com`. The old endpoint, `jsonplaceholder.org`, stopped sending CORS headers.
- `@loom-js/core` fix, found by running the restored sandbox: a component that unmounts and mounts again runs the life-cycle handlers from its new render, not the ones from its first.
- `CLAUDE.md` and `.claude/skills/skill-config.md` stop describing the sandbox as excluded.

## Capabilities

### New Capabilities

- `sandbox-baseline-health`: the sandbox installs with the workspace, type-checks with zero errors, builds, and serves its routes in dev.

### Modified Capabilities

- `unmount-teardown`: teardown also drops the life-cycle handlers a component registered, so a remount registers fresh ones.

## Impact

- `pnpm-workspace.yaml` (drop `!apps/sandbox`), `pnpm-lock.yaml`.
- `apps/sandbox/package.json`, `tsconfig.json`, `project/client/*.mts`, `src/**`.
- `packages/core/src/lib/context/life-cycles.ts`, `packages/core/tests/unit/unmount-teardown.spec.ts`.
- `CLAUDE.md`, `.claude/skills/skill-config.md`.
- `pnpm build` and `pnpm dev` now include the sandbox (dev server on port 1001).
- One patch changeset for `@loom-js/core`.
