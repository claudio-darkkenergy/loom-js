# Design — restore-sandbox-build

## Context

The sandbox is a small SPA with four routes (`/`, `/core`, `/lazyload`, `/event-monitoring`) built by esbuild with `esbuild-plugin-html-split`, the same layout as `apps/loom`. `pnpm-workspace.yaml` excludes it, so its `workspace:*` dependencies never resolve and no command covers it.

What is broken today, from a type-check against `packages/core/src`:

| File                                                         | Problem                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/bootstrap.ts`                                           | imports `ComponentProps` and `SimpleComponent`, neither exported by core   |
| `src/pages/index.ts`, `core`, `lazyload`, `event-monitoring` | import `onRoute`, now `route`                                              |
| `src/pages/core`, `lazyload`, `src/components/container`     | import `@loom-js/tags`, a package that no longer exists                    |
| `src/pages/core`, `lazyload`                                 | activity transform input is read-only; `update(input)` is typed as mutable |
| `project/client/dev.mts`                                     | reads `host` from esbuild's `ServeResult`, which now has `hosts`           |
| `project/client/config.mts`                                  | copies `./mocks/**/*`, a folder that does not exist                        |

`src/routes/pages.ts` imported `router`, `onRouteUpdate` and `sanitizeLocation`, none of which core exports. Its fix (render through `locationEffect`, trim the trailing slash locally, delete the commented-out block) was written during `route-search-params` but left out of that change's commits. It sits uncommitted in the working tree and ships with this change.

## Goals / Non-Goals

**Goals:** the sandbox installs, type-checks, builds and serves; it stays that way because workspace commands cover it.

**Non-Goals:** new sandbox features or pages; restyling; deploying the sandbox; restoring `apps/docs` or `packages/ui-kit`; recreating `@loom-js/tags`.

## Decisions

### D1 — Rejoin the workspace

Remove `!apps/sandbox` from `pnpm-workspace.yaml`. The sandbox depends on `workspace:*` packages, which only resolve inside the workspace, and membership is what puts it under `turbo build` and `type-check`. Alternative considered: keep it excluded and install it standalone against published packages. That tests the last release, not the working tree, which defeats the purpose.

### D2 — `tsx` instead of `ts-node/esm`

Match `apps/loom`: `tsx ./project/client/build.mts`. `ts-node` is one of the four tools that need a nested TypeScript 6, and the sandbox should not depend on that workaround. The `.pnpmfile.cjs` entry stays: `esbuild-plugin-html-split` and `lib/codegen` still use `ts-node`.

### D3 — Replace `@loom-js/tags` with markup

`Button`, `Img` and `Div` were thin wrappers over native elements. Pages write `<button>`, `<img>` and `<div>` in their templates, using element syntax for keyed items. Alternative considered: `@loom-js/pink` components. Rejected, since the sandbox exercises core and pink would add a design-system dependency for three elements.

### D4 — Delete dead files, keep assets

`src/pages/event-dashboard/index.ts` is an unrouted copy of the core page and `core/reactivity/live-node-array.ts` is empty; both are deleted, along with the `./mocks` copy rule. Files under `public/` stay, referenced or not.

### D5 — Keep the four routes

`/lazyload` is nearly the same page as `/core`. It stays as is; making it a lazy-loaded route is a feature, not a repair.

### D6 — Build config follows `apps/loom`

`clientConfig` takes `apiUrl` as an option and defines `__API_URL__` from it, instead of reading `process.env` inside the config. The sandbox's `turbo.json` inputs come from the root config, which already lists `API_URL`.

### D7 — Swap the photos endpoint

`jsonplaceholder.org/posts` no longer sends CORS headers, so the browser blocks the fetch. The pages fetch `jsonplaceholder.typicode.com/photos?_limit=10` and render `thumbnailUrl`. Alternative considered: a local fixture under `public/static`. Kept as the fallback if this endpoint goes the same way.

### D8 — Teardown drops component-registered life-cycle handlers

A context outlives its DOM: after an unmount it stays in its parent's scope map, and a remount re-runs the render function against it. The hook setters only register when no handler is set, so the remount's handlers were ignored and the first render's handlers ran again, closed over the first render's state. `own` values were already released on unmount; handlers were not.

`teardownContext` now resets each handler to the one given through the component's `ref`, or to nothing. The mutation callback fires every `onUnmounted` in the batch before any teardown runs, because teardown cascades into child contexts and would otherwise drop a child's handler before it fired.

Alternative considered: move the sandbox's `onCreated` work to `onRendered` or `onBeforeRender`. Those setters have the same guard, so the stale handler would still run. Alternative considered: a module-scope activity in the sandbox. It hides the bug instead of fixing it.

## Risks / Trade-offs

- [`pnpm build` and `pnpm dev` get slower and start another dev server] → the sandbox is small; port 1001 does not collide with 9092, 2000 or 6006.
- [A Vercel project builds with an unfiltered `turbo build` and now builds the sandbox too] → check each live project's build command during apply; add a filter if one is unfiltered.
- [The sandbox breaks again on the next core API change] → intended. It now fails `type-check` in the change that breaks it.
- [`changeset version` starts bumping the private sandbox] → `apps/loom` is private and in the workspace already; confirm the sandbox gets the same treatment in `.changeset/config.json`.

## Open Questions

None.
