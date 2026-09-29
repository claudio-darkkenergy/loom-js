# Tasks — restore-sandbox-build

## 1. Workspace

- [x] 1.1 Remove `!apps/sandbox` from `pnpm-workspace.yaml`; drop unused dependencies and `@loom-js/tags` from the sandbox manifest; align dev dependency versions with `apps/loom`
- [x] 1.2 Switch scripts to `tsx` (D2); remove `ts-node` from the sandbox manifest; `pnpm install`
- [x] 1.3 Confirm `.changeset/config.json` treats the sandbox like `apps/loom`

## 2. Source

- [x] 2.1 `routes/pages.ts`: keep the `locationEffect` edit already in the working tree; confirm it under the sandbox's own type-check
- [x] 2.2 `bootstrap.ts` and `components/container`: replace the removed core types and `@loom-js/tags` (D3)
- [x] 2.3 Pages: `onRoute` to `route`; `Button`/`Img` to markup; fix the activity transform typing
- [x] 2.4 Delete `src/pages/event-dashboard/` and `core/reactivity/live-node-array.ts` (D4)

## 3. Build scripts

- [x] 3.1 `config.mts`: `apiUrl` option, remove the `./mocks` copy rule (D4, D6)
- [x] 3.2 `dev.mts`: read `hosts` and `port` from `ServeResult`, with a fallback for an empty `hosts`

## 4. Verify

- [x] 4.1 `pnpm -F @loom-js/sandbox type-check` and `build` pass; `pnpm format:check` passes
- [x] 4.2 Run dev; open all four routes in a browser, click through the links, check the console
- [x] 4.3 `pnpm build` at the root passes; check each live Vercel project's build command for an unfiltered `turbo build`

## 6. Follow-ups found during verify

- [x] 6.1 Swap the photos endpoint on `/core` and `/lazyload` (D7)
- [x] 6.2 Core: failing spec for the stale remount handler, then the `teardownContext` fix (D8)
- [x] 6.3 Core: specs for `ref` handlers across a remount and for a child's `onUnmounted` when its parent is removed
- [x] 6.4 Patch changeset for `@loom-js/core`
- [x] 6.5 `pnpm -F @loom-js/core test-ci`, `type-check` and `type-check-tests` pass

## 5. Docs

- [x] 5.1 Update `CLAUDE.md` (repo shape, app build patterns, apps, tooling notes) and `.claude/skills/skill-config.md`
