# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm + turborepo monorepo published under the `@loom-js/*` scope. Workspaces are defined in `pnpm-workspace.yaml`:

- `packages/*` — published framework packages (`core`, `tags`, `pink`).
- `packages/esbuild/*` — published esbuild plugins (`esbuild-plugin-html-split`).
- `lib/*` — internal utilities (`utils`, `contentful`, `storybook`, `typescript-config`, plus untracked `codegen`, `monitor`, `open-ai`).
- `apps/*` — runnable apps. **Note:** `apps/docs` and `apps/sandbox` are explicitly excluded from the pnpm workspace (`!apps/docs`, `!apps/sandbox`) — only `apps/loom` (and any future siblings) are part of the install graph. Both excluded apps still exist on disk and have `package.json` files; they are not installed or built by `pnpm install` / `turbo`.
- `services` — Vercel serverless functions (under `services/api/`). Served via `vercel dev`.
- `packages/ui-kit` is also excluded.

Engines: Node ≥ 20, pnpm ≥ 9. The committed package manager is pnpm@10.33.0. Releases use changesets; the `main` branch publishes to npm via `.github/workflows/publish-packages.yml`.

## Common commands

Run from the repo root unless stated otherwise.

| Command                                   | What it does                                                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                            | Install all workspaces.                                                                                                                                         |
| `pnpm dev`                                | Starts the API (`vercel dev -p 2000`) **and** `turbo dev` for all apps in parallel, with `.env.local` loaded via dotenvx. This is the standard dev entry point. |
| `pnpm api`                                | Just the API: `vercel dev -p 2000`.                                                                                                                             |
| `pnpm build`                              | `turbo build` — builds apps. Depends on `^build` and `^build-package` (so packages compile first).                                                              |
| `pnpm build-packages`                     | `turbo build-package` only — compiles publishable packages to `dist/`.                                                                                          |
| `pnpm storybook`                          | `turbo storybook` — runs Storybook for `@loom-js/pink` (port 6006).                                                                                             |
| `pnpm changeset`                          | Add a changeset describing a release.                                                                                                                           |
| `pnpm status-packages`                    | `changeset status` — preview pending releases.                                                                                                                  |
| `pnpm publish-packages`                   | Build packages + version + `changeset publish`. CI runs this on push to `main`.                                                                                 |
| `pnpm clean`                              | Recursively delete every `node_modules/` in the tree.                                                                                                           |
| `pnpm outdated-deps` / `pnpm update-deps` | Recursive interactive dependency check / update.                                                                                                                |

### Filtering to a workspace

Use `pnpm -F <workspace-name> <command>`. Workspace names are the `name` from each `package.json` (e.g. `@loom-js/core`, `@loom-js/loom`, `@loom-js/pink`). Examples:

- `pnpm -F @loom-js/core build-package`
- `pnpm -F @loom-js/loom dev`
- `pnpm -F @loom-js/pink storybook`
- `pnpm -F @loom-js/<pkg> type-check` — every package exposes `type-check` (just `tsc --noEmit`).

### Tests

Tests live in `packages/core` only (the framework). They use `@web/test-runner` + puppeteer.

- `pnpm -F @loom-js/core test-ci` — single run.
- `pnpm -F @loom-js/core test-dev` — watch mode.
- `pnpm -F @loom-js/core test-debug` — watch + browser debug.
- Specs are under `packages/core/tests/**/*.spec.ts`. Run a single spec by passing `--group` or a file glob to `wtr` (edit `web-test-runner.config.mjs` `files` or pass via CLI).

### App build patterns

`apps/loom` builds with **esbuild driven by `tsx`** — entry points are `./project/client/build.mts` and `./project/client/dev.mts`, which call `clientConfig` from `./project/client/config.mts`. `dev.mts` runs `esbuild.context().serve()` on port 9092 with SPA fallback. The build emits to `./build`.

`apps/sandbox` mirrors this layout but runs the same `.mts` entrypoints through `ts-node/esm` (`node --loader ts-node/esm`) instead of `tsx`.

`turbo.json` injects `API_URL` and `CTF_IS_PREVIEW` into both `build` and `dev` tasks. `*.stories.*` files are excluded from `build` task inputs so Storybook edits don't bust the app cache.

## Architecture

### `@loom-js/core` — the framework

The core is a **reactive, components-first** library with **zero runtime dependencies**. Mental model and API surface are documented in detail in `packages/core/README.md`; a future Claude Code instance editing this package should read that file first. Key entry point: `packages/core/src/index.ts` re-exports from `activity`, `app`, `component`, `config`, `lazy-import`, `router`, `routing`, plus the `types` module.

Concepts you will see across consumers:

- **`component(template)`** — Defines a component as a tagged-template render function. The template literal must contain a single top-level element. The function returns a `Component` (a callable that produces a `ContextFunction`). Lifecycle hooks `onCreated` / `onRendered` and a `node()` getter are passed via the props arg.
- **`activity(initialValue)`** — A pub/sub reactive primitive. `activity.effect(({ value }) => ContextFunction)` queues an effect that reruns when `update(newValue)` fires. Effects must return a `ContextFunction` (i.e. the result of calling a component).
- **`router(cb)` + `onRoute(event, opts)`** — SPA routing built on top of `activity` and the History API. `router` reacts to `Location` changes; `onRoute` is the click handler you bind to anchors/buttons.
- **`init({ app, root, onAppMounted })`** — Bootstraps the app by mounting the result of an `app: ContextFunction` into a DOM root.
- The `core/src/lib/` tree contains the internals: `templating/` (HTML parsing, custom-element registration, attribute updates), `context/`, `reactive.ts`, `mount.ts`, `memo.ts`. Edits in `templating/` affect every consumer.

`@loom-js/core` builds with rollup (ES + CJS bundles + a consolidated `index.d.ts` via `rollup-plugin-dts`). Output lands in `dist/`.

### Other published packages

- **`@loom-js/tags`** — Component wrappers around HTML tags, built on `core`. peerDep: `@loom-js/core`.
- **`@loom-js/pink`** — Design system layered on `@appwrite.io/pink`. Has Storybook at port 6006 and is the only package with a `build` script (alias for `build-storybook`). peerDeps: `@loom-js/core`, `@loom-js/tags`.
- **`packages/esbuild/esbuild-plugin-html-split`** — esbuild plugin used by the apps to split the HTML template per route at build time. The `htmlSplit({ routes, template, spa, ... })` plugin call lives in each app's `project/client/config.mts`.

### Apps

- **`apps/loom`** (`@loom-js/loom`) — The documentation/marketing SPA. Pulls from Contentful (`@loom-js/contentful`). Lives at port 9092 in dev. It is the only `apps/*` workspace currently included in pnpm.
- **`apps/sandbox`**, **`apps/docs`** — Excluded from the workspace (see above). Treat as scratch space; running them requires invoking their scripts manually outside pnpm.

### Services

`services/api/*.ts` are Vercel serverless handlers. `services/vercel.json` rewrites `/api/(.*)` → `/api/$1`. They are exposed locally by `pnpm api` (port 2000) and consumed by apps via the `API_URL` env var (`__API_URL__` define is injected at build time by `clientConfig` in each app).

### Releases

- Use `pnpm changeset` to add a changeset for any package change.
- The GitHub Action (`publish-packages.yml`) opens a "Version Packages" PR on push to `main` and publishes when that PR merges. Do not bump versions manually.
- `lib/typescript-config` is the shared base tsconfig (`base.json`, `app.json`, `lib.json`); extend from it instead of duplicating compiler options.

## Tooling notes

- **Prettier config** (`.prettierrc`): 4-space tabs, single quotes, semicolons, no trailing commas, plus `prettier-plugin-sort-imports` with NPM-imports-then-local-imports ordering and a blank line between groups. Formatting matters for imports — let prettier handle them.
- **TypeScript** is `strict` with `noUncheckedIndexedAccess` and `module: NodeNext` from the shared base. `target: ES2022`.
- **Turbo cache**: outputs are `build/**` (apps) or `dist/**` (packages). Don't add files into those directories by hand expecting them to persist — they get cleaned each build.
- **`.env.local`** at the repo root is loaded by dotenvx for `pnpm dev`. App-level env vars (`API_URL`, `CTF_IS_PREVIEW`) are listed in `turbo.json` so changing them invalidates the cache.

## Skills

- [solid-principles](.claude/skills/solid-principles/SKILL.md) — Enforce all five SOLID principles on new and refactored code in this repo.
- [tdd-workflow](.claude/skills/tdd-workflow/SKILL.md) — Enforce Red → Green → Refactor TDD using `@web/test-runner` + chai + sinon.
- [solid-audit](.claude/skills/solid-audit/SKILL.md) — Audit existing code for SOLID violations and maintain `SOLID-AUDIT-REPORT.md`.

## Skill Config Rule

If any change affects folder structure, import aliases, dependencies, test configuration, or architectural conventions, update `.claude/skills/skill-config.md` as part of that same task. This file is the source of truth for all skill behavior in this project.

## Audit Rule

Before modifying any existing file, check `SOLID-AUDIT-REPORT.md` for open violations in that file. If a 🔴 Critical violation exists, resolve it before adding new code. After fixing a violation, update the report entry to ✅ Resolved using the `solid-audit` skill.

## OpenSpec

The repo has an `openspec/` directory (with `changes/archive/` and `specs/`) and matching cursor commands/skills under `.cursor/`. The available `openspec-*` / `opsx:*` skills (propose, explore, apply, archive) are the intended workflow for anything spec-driven; reach for them when the user mentions OpenSpec, change proposals, or specs rather than improvising a parallel structure.
