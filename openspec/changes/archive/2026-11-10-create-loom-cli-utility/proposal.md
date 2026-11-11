# Proposal

## Why

Starting a loom app today means copying the sandbox or the pink-tailwind example and undoing their monorepo wiring. Both extend the private `@loom-js/typescript-config`, depend on `workspace:*`, and the sandbox hand-wires dev reload, monitoring and commented-out pink theming. The getting-started topic stops at `npm i @loom-js/core`, so there's no single command that gets someone from nothing to a running `loom dev`.

## What Changes

- New published package `@loom-js/create` with a `create` bin. It's never installed into the project or globally: run it through the package manager's runner, either as `npm create @loom-js@latest my-app` / `pnpm create @loom-js` / `yarn create @loom-js` / `bun create @loom-js`, or directly as `npx @loom-js/create` / `pnpm dlx @loom-js/create` / `yarn dlx @loom-js/create` / `bunx @loom-js/create`. The unscoped `create-loom` name is taken on npm by an unrelated project.
- The default app is server-first, TypeScript, single-app: `@loom-js/build` config with a server module that prerenders every route, a browser entry that primes state and hydrates, two routes, dev live reload, devtools, a base stylesheet, README and `.gitignore`, in a fresh git repository with one initial commit.
- Choices, each at a prompt or by flag:
    - **Layout** `--layout single|monorepo` (default `single`). Monorepo puts the app at `apps/web` under package-manager workspaces with a root task runner.
    - **Task runner** `--task-runner turbo` (monorepo only). Turborepo is the only entry today; the seam is a registry so Nx or another tool is one new entry.
    - **Rendering** `--spa` opts out of server-first: no server module, the shells boot empty and the app mounts with `init`.
    - **UI kit** `--ui none|pink` (default `none`). A registry: pink is the first kit, and later kits are new entries.
    - **Tailwind** `--tailwind` opts in to Tailwind CSS v4, wired the way the pink-tailwind example proves.
    - **Formatter** `--formatter biome|prettier|none` (default `biome`). A registry: the entry writes its config in loom's house style and adds `format` / `format:check` scripts, and every generated file passes it. Biome is the default and also sorts imports, natively, as part of house style. It's a single dev dependency and far faster. Choosing Prettier gets plain Prettier in house style with no plugins preinstalled, so import sorting is the user's call. Other formatters are new entries.
    - **Language** `--js` opts out of TypeScript. The JS templates are generated from the TS ones, never written by hand.
    - **Git** `--git new|none|<url>` (default `new`): `git init` plus an initial commit, no repository, or clone an existing repository and scaffold into it. Never pushes.
    - **Install** `--install` / `--no-install` (default on), using the package manager that invoked the CLI.
- Interactive prompts run when stdin is a TTY. `--yes` and non-TTY runs take the defaults without asking.
- Zero runtime dependencies (`node:util` `parseArgs`, `node:readline/promises`), and no network access except the install and an explicit clone.
- Dependency ranges are stamped at build time: `@loom-js/*` from workspace versions, third-party tools (TypeScript, Tailwind, Turborepo, Biome, Prettier) from `@loom-js/create`'s own dev dependencies. A CI guard fails a push to `edge` when a pending release moves a template's `@loom-js` dependency out of the stamped range without a `@loom-js/create` changeset.
- The app directory in a monorepo matches a single-layout app except for files the root owns. That keeps a later conversion mechanical. Upgrade and downgrade between layouts are a follow-up change, not this one.
- Docs: the `getting-started` topic leads with the create command (both invocation forms), the `build-tool` quick start points at it, and both are pushed and published to Contentful.

## Capabilities

### New Capabilities

- `app-scaffolding`: how a new loom app is created. It covers the invocation forms, prompts and flags, the defaults, the layout, task runner, UI kit, rendering, styling, formatter, language and git choices, the generated files for each, the guarantee that every combination builds, and how dependency versions stay in step with the published packages.

### Modified Capabilities

None. `docs-build-tool-coverage` and `docs-content-coverage` already require the topics to match what ships; this change updates topic content under those requirements.

## Impact

- New `packages/create` (CLI source, `templates/`, rollup build that also generates the JS templates, `node --test` suite). It's a new published package, so the first publish is done by hand from `claudionunezjr`, and a trusted publisher is set up before CI can publish it.
- `.github/workflows/core-tests.yml`: runs `@loom-js/create`'s `test-ci` and the release-sync guard.
- `.prettierrc` `packageJSONFiles` gains `packages/create/package.json`.
- `docs/topics/01-getting-started.md`, `docs/topics/15-build-tool.md`, and the Contentful push and publish for both.
- CLAUDE.md "Repo shape" and `.claude/skills/skill-config.md` list the new package.
- No changes to existing packages' code or APIs. Overlaps with in-flight `loom-dev-parity` only in that the server-first template uses the current `prerender` hook names. Whichever change lands second updates the template, and the scaffold test catches it.
- Overlaps with in-flight `auto-render-selection` the same way: it changes the `prerenderRoute` contract (a `request` argument, `dependencies` in the output, `renderPage` as the one-call render), so whichever lands second updates the server module template. The template keeps rendering in one function so that move is a one-body edit.
- The repo itself stays on Prettier. Moving it to Biome is a proof of concept on an isolated experimental branch (`adopt-biome`), outside the dev and release flow and never merged. This change doesn't depend on it.
- Follow-ups: a layout conversion change (`single` ↔ `monorepo`, with downgrade guarded to the shape create produces), and host adapter / content source layers (`--adapter`, `--source`) after `auto-render-selection`.
