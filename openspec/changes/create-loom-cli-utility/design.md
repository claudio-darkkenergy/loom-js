# Design

## Context

- `@loom-js/build` already does the work: `loom dev` / `loom build` over `loom.config.*`, one shell per route, an optional prerender phase. The scaffolder writes a config and source tree for it and does nothing at build time. It loads `loom.config.{ts,mts,js,mjs}`, and esbuild picks up `tsconfig.json` or `jsconfig.json` paths on its own (`esbuild-options.ts` passes no tsconfig).
- `loom dev` serves through esbuild, which exposes a `/esbuild` change-event stream but injects no reload client. Apps wire it themselves. In-flight `loom-dev-parity` keeps that as is.
- `@loom-js/typescript-config` is private, so a standalone app can't extend it. Its `app.json` + `base.json` options get inlined.
- `@loom-js/core` 0.21.0, `build` 0.2.0, `pink` 0.10.1 and `devtools` 0.1.0 are all published. `create-loom` on npm belongs to someone else; `@loom-js/create` is free.
- `npm create @loom-js` resolves to `npm exec @loom-js/create`. pnpm, yarn and bun map their `create` the same way onto `dlx` / `bunx`. Nothing is installed in either form.
- Pink needs a theme class on `<body>`. The pink-tailwind example proves the Tailwind wiring: the Tailwind CLI writes `.generated/styles.css` before `loom build`, `styles.css` imports pink before `tailwindcss` (pink declares the layer order), and `@source not inline(...)` keeps pink's block class names.
- Pre-1.0 caret ranges pin the minor (`^0.21.0` means `<0.22.0`), and breaking changes ship as minors with no aliases. A published template is only good for the minor it was written against.
- In-flight `auto-render-selection` moves the server module to `renderPage` and `prerenderRoute(url, window, request)`.

## Goals / Non-Goals

**Goals:**

- `npm create @loom-js my-app` → `cd my-app` → `npm run dev` works with no edits, for every choice combination.
- The generated code reads like the docs' examples (`app-structure`, `build-tool` quick start), so the docs explain the app the user just got.
- New UI kits, task runners and formatters are one registry entry each, plus a template layer for a kit.
- CI proves every combination against current workspace code.

**Non-Goals:**

- Remote or third-party templates (`--template <git-url>`).
- Converting between layouts. This change keeps the two layouts structurally parallel so the follow-up conversion change is a file move plus root rewrite (see "Layout parity").
- Host adapters and content sources. The planned next layers are `--adapter <host>` and `--source <cms>`, after `auto-render-selection` and the first adapter land. They install the plugins `@loom-js/build` defines, add a `changeSources` stub and render rule, generate per-source secrets into `.env.local` (offline), and leave the credentialed steps (host env vars, webhooks) to `loom setup changes`. Create stays offline.
- Request-time SSR as a create choice. Render modes come from `loom build` itself once `auto-render-selection` lands, and the server-first template is what it builds on.
- Testing or linting setups in the generated app.
- Pushing to a remote, or creating a hosted repository.

## Decisions

### Choices are a small fixed set plus registries

```
fixed:      layout (single|monorepo)  rendering (server-first|--spa)  tailwind  language (ts|--js)  git  install
registries: ui-kits      { none, pink }       → --ui <id>
            task-runners { turbo }           → --task-runner <id>   (monorepo only)
            formatters   { biome, prettier } → --formatter <id>|none
```

A registry entry is a module exporting a typed descriptor. **UI kit:** `id`, `label`, `packages` (names; ranges stamped), `entryStyles` (CSS imports), `bodyClass`, `layer` (template dir), `tailwind` (`{ import, sourceExclusions }`). **Task runner:** `id`, `label`, `devDependencies`, `rootFiles(ctx)`, `rootScripts`, `gitignore`. **Formatter:** `id`, `label`, `devDependencies`, `files` (config + ignore, keyed by path), `scripts` (`format`, `format:check`). Prompts, `--help` and validation enumerate the registries, so an Nx entry or a second kit needs no other edit. The test matrix iterates the registries too, so a new entry is tested by default.

- Alternative: boolean flags per product (`--pink`, `--turbo`, `--prettier <config>`). Simpler today, but every new kit adds a flag and its exclusions with the others.

### Formatter

House style: 4-space indent, 80 columns, single quotes, semicolons, no trailing commas. Imports go npm first, then a blank line, then local (`@app/*`, relative), each group alphabetical, with `node:` builtins at the top of the npm group.

- **biome** (default): `biome.json` with the formatter settings above, `css.parser.tailwindDirectives` on, the linter off, and `assist.actions.source.organizeImports` with groups `[[":NODE:", ":PACKAGE:", ":PACKAGE_WITH_PROTOCOL:"], ":BLANK_LINE:", [":ALIAS:", ":PATH:"]]`. `files.includes` excludes `build` and `.generated`. Scripts are `format: biome check --write` and `format:check: biome check`, and the one dev dependency is `@biomejs/biome`. A POC against the repo's source (Biome 2.6.5, 340 files) ran in 41 ms against Prettier's 1.95 s on the same tree, sorted imports with no plugin, and parsed Tailwind v4 directives cleanly.
- **prettier**: `.prettierrc` with the formatting settings above and no `plugins`, plus a `.prettierignore` for `build/` and `.generated/`. Prettier is an explicit choice now, so the entry gives plain Prettier in house style and leaves import sorting to the user. The templates still arrive in house import order, because they're authored that way, and plain Prettier never reorders them. Entries never preinstall plugins for their tool.

The two tools disagree on a few layouts (Biome breaks short unions into one `| A` per line and lays out `interface … extends` differently), so neither tool's output passes the other's check. `build-package` therefore formats the templates once per registered formatter into `dist/templates/<formatter>/<lang>/`, using create's own dev-dependency binaries and the exact config the entry ships. `none` copies the default formatter's tree. Rendered files (package.json, config, entry, styles) are written in a canonical form every registered formatter accepts unchanged: short lines and no multi-member unions. The matrix enforces it. The repo's Prettier only formats the source `templates/`, so the repo staying on Prettier and generated apps defaulting to Biome don't conflict. In a monorepo the entry's files, scripts and dependency go to the root.

Biome is both a formatter and a linter, and the entry writes `biome.json` with the linter off. If a `--linter` registry comes later, a tool covering both must own one shared config, and because entries key their files by path, two entries writing `biome.json` hit the same collision check the layers use.

- Alternative: `--prettier <config_path>`. A path outside the target breaks the standalone rule unless the file is copied in, and honoring a copied config means formatting during scaffolding, which needs the install first. If it's wanted, it can come later as `--formatter-config <path>`.
- Alternative: passing formatter options through. `parseArgs` takes no variadic tail, and it ties the CLI to one tool's flags.

### Templates are layered trees, cross-feature files are rendered from code

```
templates/base/           every app (app module, pages, base.css, README, _gitignore, types.d.ts)
templates/server/         server module          (skipped with --spa)
templates/ui/<kit>/       the kit's pages        (one per kit)
templates/tailwind/       app shell with utilities, .generated ignore
render/                   package.json, loom.config, bootstrap, styles.css (tailwind), tsconfig/jsconfig, monorepo root
```

Layers are copied base → server → ui → tailwind. A file may be overridden by at most one non-base layer, and a test asserts that, so the order never matters. Files that more than one choice shapes are rendered by small functions: `package.json`, `loom.config.*` (styles, `bodyClass`, `prerender`), `src/bootstrap.*` (dev reload, kit CSS, `init` vs prime + `hydrate`), Tailwind's `src/styles.css` (kit import and source exclusions first, then `tailwindcss`), and the TS/JS config files. Rendered files contain no type syntax, which keeps one renderer valid for both languages, and a test asserts it. `.gitignore` is stored as `_gitignore` because npm strips `.gitignore` from tarballs.

- Alternative: render every file from code. One path, but the templates stop being real files that prettier formats and editors check.
- Alternative: one full template per combination. 32 copies.

### JavaScript templates are generated at build time

`build-package` derives the JS tree from `templates/` with `node:module` `stripTypeScriptTypes` (strip mode keeps comments and layout), then formats it per formatter as above into `dist/templates/<formatter>/js/`. `types.d.ts` files are dropped. Strip mode rejects enums and namespaces, so the TS templates must stay erasable, and the build fails if they aren't. `--js` copies from the JS tree and renders `loom.config.mjs` and `jsconfig.json` (same `@app/*` alias) in place of the TS forms, and leaves out `typescript` and `type-check`.

- Alternative: hand-written JS templates. They drift.
- Alternative: strip at scaffold time. That needs Node ≥ 22.13 at the user's end, and the API still prints an experimental warning.

### Server-first by default, render in one function

The default `src/prerender.entry.ts` exports `routes` and one `prerenderRoute(url, window)` whose body is the only place the render contract appears (`renderToString` + `dehydrate` today). When `auto-render-selection` lands, that body becomes `renderPage(App(), { window, url, request })` and the signature gains `request`, an edit in one place. `--spa` skips `templates/server` and renders a config without `prerender` and an `init` entry.

### Layout parity

```
single:   my-app/{package.json, loom.config.ts, tsconfig.json, src/, public/, .gitignore, README.md}
monorepo: my-repo/{package.json, <workspace decl>, <task runner files>, tsconfig.base.json, .gitignore, README.md, packages/}
          my-repo/apps/web/{package.json, loom.config.ts, tsconfig.json → extends ../../tsconfig.base.json, src/, public/}
```

The app is rendered by the same functions for both layouts. The monorepo renderer only moves the root-owned files to the root: `.gitignore`, README, and the compiler options into `tsconfig.base.json`. The app's package is named `web`. A test diffs `single` against `apps/web` for each combination and allows only those differences. The follow-up conversion relies on this: upgrade moves the app to `apps/web` and writes the root, and downgrade is the inverse, allowed only when the tree still has that shape.

Workspace declaration by package manager: pnpm writes `pnpm-workspace.yaml`, npm / yarn / bun write `package.json` `workspaces`. The root `package.json` sets `packageManager` from the detected manager and version, which Turborepo requires. Yarn ≥ 2 also gets `.yarnrc.yml` with `nodeLinker: node-modules`, because esbuild can't resolve through Plug'n'Play.

### Tailwind dev runs through a small script

The Tailwind layer adds `scripts/dev.mjs`, which spawns the Tailwind CLI in watch mode and `loom dev`, inherits stdio, and kills both when either exits. That makes `dev` work on Windows, where the example's `a & b` shell form doesn't. `build` runs the CLI once and then `loom build`. This is an interim fix: if `@loom-js/build` grows a stylesheet-preprocessor seam, the layer moves to it and the script is deleted in that change.

### Git

```
validate ─► [clone url → target] ─► conflict check ─► write ─► install ─► git init? ─► commit ─► next steps
```

- `new`: `git init`, then one commit (`Initial commit from @loom-js/create`) after install so the lockfile is in it. With no identity (`git config user.email` empty) it inits only and prints the two commands to finish. With no `git` binary it skips the step with a note.
- `<url>`: `git clone` first, so conflicts are known before anything is written. `README.md`, `LICENSE` and `.gitignore` from the clone are kept, and the scaffold's ignore lines are appended to `.gitignore` when missing. Any other overlap removes what the CLI cloned (the target itself if the CLI created it, otherwise its contents) and exits 1. The commit lands on the cloned branch. Next steps end with `git push`.
- `none`: no git command runs.

### Versions are stamped at build time

The rollup build inlines a constant: `@loom-js/{core,build,pink,devtools}` → `^<workspace version>`, and `typescript`, `tailwindcss`, `@tailwindcss/cli`, `turbo`, `@biomejs/biome`, `prettier` → the ranges in `@loom-js/create`'s own `devDependencies`, which the matrix test links. The CLI never touches the network to pick versions.

- Alternative: look up `latest` at scaffold time. Always fresh, but a breaking core minor would then break every app the old templates generate.

### The release-sync guard

`packages/create/scripts/check-release-sync.mjs` runs `changeset status --output`, and for each `@loom-js` package the templates use, checks the pending version against `^<current workspace version>`. Out of range with no `@loom-js/create` release means exit 1. It runs in `core-tests.yml` on edge pushes. On edge the workspace version equals the last published version, because versions only move in the Version Packages PR, so `^current` is what the published create stamps.

- Alternative: changesets `fixed` group. This forces one shared version, which breaks pink's independent pre-1.0 line.
- Alternative: peer or regular deps on the template packages. Peer range changes force a major, and regular deps bloat `npm create` with esbuild.

### Zero-dependency CLI

`node:util` `parseArgs` (`strict`) handles flags, `node:readline/promises` asks yes/no and numbered-choice prompts, and `node:util` `styleText` handles color, which needs Node ≥ 20.12, set in `engines`. Package-manager detection reads `npm_config_user_agent` (`pnpm/9.12.0 …` → name + version), else npm, with `<pm> --version` as the fallback for `packageManager`. Name validation is a short regex for the npm rules. The CLI core is a function over `(argv, env, io, spawn)`, so tests drive it without a TTY, network or real git.

### Scaffold test

`node --test` in `packages/create` (`test-ci`, depends on `^build-package`):

```
for combo in layouts × {server-first, spa} × ui-kits × {±tailwind} × {ts, js}     (32 today)
  scaffold → os.tmpdir()/combo   (--no-install --git none)
  link node_modules/@loom-js/{core,build,pink,devtools} → workspace packages
  link typescript / tailwindcss / @tailwindcss/cli / biome / prettier → create's devDependencies
  [tailwind] CLI once ── [ts] tsc --noEmit ── each formatter's check ── loom build (in the app dir) ── assert output
```

The tests run concurrently. Monorepo combos build in `apps/web` directly rather than through turbo, so they stay hermetic. The turbo run itself is checked in the manual end-to-end pass with real installs. The symlinks resolve to the workspace realpaths, so pink's peer `@loom-js/core` and the app's are one module instance. Unit cases cover flags, defaults, non-TTY, registry validation, clobber and conflict rules, git paths (stubbed `spawn`), the layer-ownership and no-type-syntax rules, formatter `none`, layout parity, and the leakage sweep.

## Risks / Trade-offs

- [The 32-combination matrix slows CI as registries grow] → the cost is one esbuild build per combo, a few seconds each, run concurrently. If a third kit or task runner pushes the suite past about 3 minutes, switch to a pairwise covering set. That changes the test, not the spec, because each pair is still built.
- [A template uses an API that changes in the same commit] → the scaffold test runs against workspace code, so the commit that breaks it fails CI.
- [A rendered file isn't in canonical form for one formatter] → the matrix runs every registered formatter's check on every combination, so the render that breaks it fails CI.
- [Biome's native binary is about 81 MB per platform, against Prettier's 9.6 MB] → only one platform package installs per machine. Users who mind pick `--formatter prettier`.
- [`stripTypeScriptTypes` changes behavior while it's still experimental] → it runs only at our build time on a pinned Node, and the matrix builds every JS combo.
- [`changeset status` on CI's shallow checkout] → verify on the first push, and fall back to `fetch-depth: 0` for that job.
- [First publish of a new scope package fails in CI with 404/403] → hand-publish 0.1.0 from `claudionunezjr`, then add the trusted publisher.
- [Package-manager quirks (yarn PnP, bun workspaces, turbo's `packageManager` check)] → handled in the root renderer, and checked by the manual pass under npm, pnpm, yarn and bun.
- [Dev reload lives in user code] → if `@loom-js/build` later injects a reload client, the template drops its line in that change.

## Migration Plan

New package, nothing to migrate. Rollback means deprecating `@loom-js/create` on npm and reverting the docs topics.
