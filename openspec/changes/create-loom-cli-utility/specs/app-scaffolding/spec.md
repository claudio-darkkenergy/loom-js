# Spec Delta

## Purpose

Gets a developer from nothing to a running loom app with one command. The result is a standalone project that installs from npm, builds and serves with `@loom-js/build`, and is server-first and TypeScript by default, with layout, UI kit, rendering, styling, language and git as explicit choices.

## ADDED Requirements

### Requirement: Runs without being installed

`@loom-js/create` SHALL be a published package whose bin creates a loom app, runnable through a package manager's create sugar or its one-off runner, taking the target directory as the first positional argument. Running it SHALL add nothing to the project's or the global dependencies.

#### Scenario: Create sugar

- **WHEN** a user runs `npm create @loom-js@latest my-app -- --yes`, `pnpm create @loom-js my-app --yes`, `yarn create @loom-js my-app --yes` or `bun create @loom-js my-app --yes`
- **THEN** `my-app/` holds the scaffolded app and the command exits 0

#### Scenario: One-off runner

- **WHEN** a user runs `npx @loom-js/create my-app --yes`, `pnpm dlx @loom-js/create my-app --yes`, `yarn dlx @loom-js/create my-app --yes` or `bunx @loom-js/create my-app --yes`
- **THEN** the result is the same as the create sugar form, and `@loom-js/create` appears in no generated `package.json`

#### Scenario: Current directory

- **WHEN** the target is `.` in an empty directory
- **THEN** the app is scaffolded into the current directory

### Requirement: The target directory is never clobbered

The CLI SHALL refuse a target directory that exists and is not empty, exiting non-zero without writing any file. A directory holding only `.git` SHALL count as empty.

#### Scenario: Non-empty target

- **WHEN** the target directory contains `index.html`
- **THEN** the CLI prints an error naming the directory, writes nothing, and exits 1

#### Scenario: Fresh git checkout

- **WHEN** the target directory contains only `.git/`
- **THEN** the app is scaffolded into it

### Requirement: The package name comes from the directory

The root `package.json` `name` SHALL be the target directory's basename, lowercased, with whitespace replaced by `-`. When the result is not a valid npm package name the CLI SHALL exit non-zero before writing anything, naming the invalid value.

#### Scenario: Name normalization

- **WHEN** the target is `./My App`
- **THEN** the root `package.json` has `"name": "my-app"`

#### Scenario: Invalid name

- **WHEN** the target is `./_private`
- **THEN** the CLI exits 1 with an error naming `_private`, and no directory is created

### Requirement: Defaults

Every choice SHALL have a default, used under `--yes`, in a non-TTY run, and preselected at its prompt: target `loom-app`, layout `single`, server-first rendering, UI kit `none`, no Tailwind, formatter `biome`, TypeScript, git `new`, install on. In a monorepo the task runner default SHALL be `turbo`.

#### Scenario: All defaults

- **WHEN** a user runs the CLI with `my-app --yes`
- **THEN** the app is single-layout, TypeScript, server-first, Biome-formatted, has no UI kit or Tailwind, has installed dependencies, and is a git repository with one commit

### Requirement: Interactive prompts with flag overrides

When stdin and stdout are a TTY, the CLI SHALL prompt for each choice no flag answered, and only those. A flag SHALL always win over its prompt. The task runner prompt SHALL appear only when the layout is `monorepo`.

#### Scenario: Flags skip prompts

- **WHEN** a user runs the CLI in a terminal with `my-app --layout single --spa --ui pink --tailwind --formatter none --js --git none --no-install`
- **THEN** no prompt is shown, and the app reflects every flag

#### Scenario: Partial flags

- **WHEN** a user passes only `--ui pink` in a terminal
- **THEN** the CLI prompts for every other choice except the task runner, and asks for the task runner only if `monorepo` is picked

### Requirement: Non-interactive runs never block

When stdin is not a TTY, the CLI SHALL use the defaults for every choice no flag answered, and SHALL never wait for input.

#### Scenario: Piped run

- **WHEN** the CLI runs with stdin closed and only a directory argument
- **THEN** it scaffolds with the defaults and exits without reading stdin

### Requirement: Invalid input is rejected before writing

An unknown flag, a value not in a choice's registry, or a choice that doesn't apply (`--task-runner` with layout `single`) SHALL print the usage text with the reason and exit non-zero without writing any file. `--help` SHALL print the usage text, listing each registry's values, and exit 0.

#### Scenario: Typo flag

- **WHEN** a user passes `--tailwnd`
- **THEN** the CLI prints usage naming the unknown option, exits 1, and creates nothing

#### Scenario: Unregistered value

- **WHEN** a user passes `--ui bootstrap`
- **THEN** the CLI exits 1 naming `bootstrap` and listing the registered kits, and creates nothing

#### Scenario: Inapplicable choice

- **WHEN** a user passes `--task-runner turbo --layout single`
- **THEN** the CLI exits 1 saying the task runner applies only to a monorepo, and creates nothing

### Requirement: Apps are standalone

Every scaffolded app SHALL install from the public npm registry. No generated file SHALL reference the loom monorepo: no `workspace:` protocol, no unpublished `@loom-js` package, no path outside the target directory. TypeScript configuration SHALL be self-contained in the target directory.

#### Scenario: No monorepo leakage

- **WHEN** any choice combination is scaffolded
- **THEN** no generated file contains `workspace:`, `@loom-js/typescript-config`, or a path outside the target directory

### Requirement: The default app's file set

The default app SHALL contain: `package.json` with `dev`, `build` and `type-check` scripts; `loom.config.ts`; `tsconfig.json`; an app module exporting `App`; a browser entry; a server module; two client-side routes; a base stylesheet; the default formatter's config with `format` and `format:check` scripts; `.gitignore` covering `node_modules` and `build`; and a README naming the scripts.

#### Scenario: Default file set

- **WHEN** the app is scaffolded with defaults
- **THEN** each file above is present, and `.gitignore` is named `.gitignore` in the output

#### Scenario: Routes deep-link

- **WHEN** the default app is built
- **THEN** the build has an `index.html` shell for `/` and for the second route

### Requirement: Dev reload is development-only

The browser entry SHALL reload the page when `loom dev` rebuilds, and that reload code SHALL be absent from a production build.

#### Scenario: Production bundle

- **WHEN** a scaffolded app runs `build`
- **THEN** the emitted JavaScript contains no reference to the dev server's change-event endpoint

### Requirement: Server-first rendering by default

By default the app SHALL have a server module and a `prerender` config section covering every route, and its browser entry SHALL prime embedded state and hydrate. A production `build` SHALL write each route's rendered markup and state into its shell. The server module SHALL render a route in a single function, so a change to the render contract touches one function body.

#### Scenario: Prerendered build

- **WHEN** a default app is built
- **THEN** each route's `index.html` contains that route's rendered markup and a state script

### Requirement: Client-only rendering is opt-in

With `--spa`, the app SHALL have no server module and no `prerender` config section, and its browser entry SHALL mount with `init`.

#### Scenario: SPA build

- **WHEN** an app scaffolded with `--spa` is built
- **THEN** each shell's app root is empty, and the config has no `prerender` key

### Requirement: UI kits come from a registry

`--ui` SHALL accept `none` or any registered kit. Choosing a kit SHALL add its packages, load its stylesheets, apply any body class it needs, and render at least one page from its components. With `none`, no generated file SHALL reference any kit. The registry SHALL hold `pink` at first; adding a kit SHALL require no change to the prompts, flags or other kits.

#### Scenario: Pink kit

- **WHEN** an app scaffolded with `--ui pink` is built
- **THEN** the build's stylesheets include pink's rules, the shells' body has pink's theme class, and the rendered home page uses a pink component

#### Scenario: No kit

- **WHEN** the app is scaffolded with `--ui none`
- **THEN** no generated file mentions `@loom-js/pink`

### Requirement: Tailwind is opt-in

With `--tailwind`, the app SHALL generate its stylesheet with Tailwind CSS v4. The `build` script SHALL generate it before the loom build. The `dev` script SHALL keep it regenerating alongside `loom dev`, on every OS the CLI supports. With a UI kit, a Tailwind utility on a kit component SHALL override the kit's own rule.

#### Scenario: Tailwind build

- **WHEN** an app scaffolded with `--tailwind` is built
- **THEN** the linked stylesheet contains the rules for the utilities its templates use

#### Scenario: Tailwind over a kit

- **WHEN** an app scaffolded with `--tailwind --ui pink` is built
- **THEN** the linked stylesheet declares pink's layer before Tailwind's `utilities` layer, and keeps pink's block class names out of the generated utilities

### Requirement: TypeScript is the default, JavaScript is opt-in

With `--js`, the app SHALL contain no TypeScript source, no `tsconfig.json`, no `typescript` dependency and no `type-check` script. It SHALL have `loom.config.mjs`, a `jsconfig.json` carrying the same path alias, and the same behavior and file layout as the TypeScript app for the same choices.

#### Scenario: JS app

- **WHEN** the app is scaffolded with `--js` and built
- **THEN** no generated file ends in `.ts`, and the build output has the same shells and routes as the TypeScript app with the same choices

### Requirement: Single-app layout by default, monorepo opt-in

With `--layout monorepo`, the target SHALL be a workspace root with the app at `apps/web`, an empty `packages/` for shared workspace packages, workspaces declared the way the invoking package manager expects, a shared TypeScript base config, and root `dev`, `build` and `type-check` scripts that run the app's through the task runner.

#### Scenario: Monorepo with pnpm

- **WHEN** a user runs `pnpm create @loom-js my-repo --layout monorepo --yes`
- **THEN** `my-repo/pnpm-workspace.yaml` lists `apps/*` and `packages/*`, the root `package.json` names the pnpm version in `packageManager`, and `pnpm dev` at the root starts the app's dev server

#### Scenario: Monorepo with npm

- **WHEN** the same run uses `npx @loom-js/create`
- **THEN** the root `package.json` declares `workspaces: ["apps/*", "packages/*"]`, and there is no `pnpm-workspace.yaml`

### Requirement: Task runners come from a registry

`--task-runner` SHALL accept any registered task runner. The registry SHALL hold `turbo` at first. Each entry SHALL own its root files, root scripts, dev dependencies and ignored paths, so adding one (for example Nx) SHALL require no change to the layouts, prompts or other entries.

#### Scenario: Turbo

- **WHEN** a monorepo is scaffolded with the default task runner
- **THEN** the root has `turbo.json` with `build`, `dev` and `type-check` tasks, `turbo` is a root dev dependency, and `.gitignore` lists `.turbo`

### Requirement: Formatters come from a registry

`--formatter` SHALL accept `none` or any registered formatter, and the registry SHALL hold `biome` and `prettier` at first. Each entry SHALL apply loom's house style for that tool. An entry SHALL install only the tool itself, never plugins for it. Import sorting (npm imports, a blank line, then local imports, each alphabetical) is part of house style only where the tool does it natively. An entry SHALL own its config and ignore files, its `format` and `format:check` scripts, and its dev dependency, so adding one SHALL require no change to the prompts, flags or other entries. Every generated file SHALL pass the chosen formatter's check as scaffolded. With `none`, the app SHALL have no formatter config, scripts or dependency.

#### Scenario: Biome by default

- **WHEN** an app is scaffolded with defaults and installed
- **THEN** it has `biome.json`, `@biomejs/biome` as its only formatter dev dependency, and `format:check` exits 0 without any edit

#### Scenario: Prettier

- **WHEN** an app is scaffolded with `--formatter prettier` and installed
- **THEN** it has `.prettierrc` and `.prettierignore`, `prettier` as its only formatter dev dependency, `.prettierrc` lists no plugins, and `format:check` exits 0 without any edit

#### Scenario: Biome sorts imports

- **WHEN** a generated module's imports are shuffled in a Biome app and its `format` script runs
- **THEN** the imports return to npm-then-local order with one blank line between the groups

#### Scenario: No formatter

- **WHEN** the app is scaffolded with `--formatter none`
- **THEN** no generated file mentions `biome` or `prettier`, and `package.json` has no `format` or `format:check` script

#### Scenario: Monorepo formatter

- **WHEN** a monorepo is scaffolded with the default formatter
- **THEN** the formatter config, ignore file, scripts and dev dependency sit at the workspace root and cover `apps/` and `packages/`

### Requirement: Layouts differ only in root-owned files

For the same choices, the files under a monorepo's `apps/web` SHALL be identical to a single-layout app's, except files the workspace root owns: `.gitignore`, the README, lockfiles, the formatter's config, and the TypeScript config's base reference. The app's `package.json` SHALL differ only in `name` and the formatter scripts and dev dependency, which move to the root.

#### Scenario: Layout parity

- **WHEN** the same choices are scaffolded once as `single` and once as `monorepo`
- **THEN** diffing the single app against `apps/web` shows only the listed root-owned differences

### Requirement: Git: new repository by default

With git `new`, the CLI SHALL `git init` the target and make one commit holding every scaffolded file, after the install so the lockfile is included. When git has no user identity configured it SHALL init without committing and say so. When git isn't installed it SHALL skip the git step and say so. Neither case SHALL fail the run.

#### Scenario: Initial commit

- **WHEN** an app is scaffolded with defaults on a machine with a git identity
- **THEN** the target is a git repository with exactly one commit, and `git status` is clean

#### Scenario: No identity

- **WHEN** git has no `user.email` configured
- **THEN** the repository is initialized with no commit, the CLI prints how to set the identity and commit, and exits 0

### Requirement: Git: scaffold into an existing repository

With `--git <url>`, the CLI SHALL clone the repository into the target and scaffold on top. Files a fresh hosted repository carries (`README.md`, `LICENSE`, `.gitignore`) SHALL be kept, and the scaffold's `.gitignore` entries merged in. Any other scaffold file that already exists SHALL abort the run, remove the clone the CLI made, and name the conflicting paths. On success the CLI SHALL commit on the cloned branch and never push.

#### Scenario: Fresh hosted repo

- **WHEN** the URL points at a repository holding only `README.md` and `LICENSE`
- **THEN** both are kept unchanged, the scaffold is committed on top, nothing is pushed, and the next steps include `git push`

#### Scenario: Conflicting repo

- **WHEN** the cloned repository already has a `package.json`
- **THEN** the CLI exits 1 naming `package.json`, and the target directory doesn't exist afterwards

#### Scenario: Clone fails

- **WHEN** the clone exits non-zero
- **THEN** the CLI prints git's error, writes nothing, and exits 1

### Requirement: Git can be skipped

With `--git none`, the CLI SHALL run no git command.

#### Scenario: No git

- **WHEN** the app is scaffolded with `--git none`
- **THEN** the target has no `.git` directory

### Requirement: Every combination builds

Every combination of layout, rendering, UI kit, Tailwind and language SHALL production-build against the current workspace versions of the packages it depends on, every TypeScript combination SHALL type-check, and every combination's files SHALL pass each registered formatter's check. This SHALL be enforced by an automated test in CI.

#### Scenario: Combination matrix

- **WHEN** the scaffolding test suite runs
- **THEN** every combination is scaffolded, built, (for TypeScript) type-checked and format-checked, and the suite fails if any one does not

### Requirement: Dependency versions match the tested packages

The `@loom-js/*` ranges in a scaffolded app SHALL be caret ranges of those packages' workspace versions when `@loom-js/create` was built. Third-party tool ranges SHALL be the ranges `@loom-js/create`'s own tests ran against. The CLI SHALL make no network request to choose versions.

#### Scenario: Stamped ranges

- **WHEN** `@loom-js/create` is built while the workspace has `@loom-js/core` at `0.21.0`
- **THEN** an app it scaffolds depends on `@loom-js/core` `^0.21.0`

### Requirement: Releases keep the scaffolder in step

CI SHALL fail when the pending release moves any `@loom-js` package the templates depend on to a version outside the range `@loom-js/create` stamps, unless that release also includes `@loom-js/create`.

#### Scenario: Core minor without create

- **WHEN** a pending changeset bumps `@loom-js/core` from `0.21.x` to `0.22.0` and no changeset names `@loom-js/create`
- **THEN** the CI check fails with a message asking for a `@loom-js/create` changeset

#### Scenario: Core patch

- **WHEN** a pending changeset bumps `@loom-js/core` from `0.21.0` to `0.21.1` only
- **THEN** the CI check passes

### Requirement: Install uses the invoking package manager

When install is on, the CLI SHALL install with the package manager that invoked it (npm, pnpm, yarn or bun, read from the invocation environment), falling back to npm. The closing next-steps message SHALL use that manager's commands.

#### Scenario: pnpm invocation

- **WHEN** a user runs `pnpm create @loom-js my-app` and accepts install
- **THEN** dependencies are installed with pnpm, and the next steps read `cd my-app` then `pnpm dev`

#### Scenario: Install fails

- **WHEN** the install command exits non-zero
- **THEN** the scaffolded files stay in place, no commit is made, the CLI prints the install command to run by hand, and exits 1

### Requirement: The scaffolder is dependency-free and offline

`@loom-js/create` SHALL declare no runtime `dependencies`. Apart from the install step and an explicit `--git <url>` clone, it SHALL make no network request.

#### Scenario: Published manifest

- **WHEN** the package is packed for publish
- **THEN** its `package.json` has no `dependencies` field, or an empty one

#### Scenario: Offline run

- **WHEN** the CLI runs with `--no-install --git new` and no network
- **THEN** it scaffolds and commits successfully
