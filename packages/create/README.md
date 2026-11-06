# @loom-js/create

Creates a loom app. Run it through your package manager; nothing is installed into your project or globally.

```sh
npm create @loom-js@latest my-app
pnpm create @loom-js my-app
yarn create @loom-js my-app
bun create @loom-js my-app
```

The direct forms do the same: `npx @loom-js/create`, `pnpm dlx @loom-js/create`, `yarn dlx @loom-js/create`, `bunx @loom-js/create`. With npm, pass flags after `--` (`npm create @loom-js@latest my-app -- --yes`).

Requires Node 20.12 or later.

## What you get

By default: a single app that builds with [`@loom-js/build`](https://www.npmjs.com/package/@loom-js/build), server-first (every route prerendered at build time, then hydrated), in TypeScript, formatted with Biome, in a new git repository with one commit, with dependencies installed.

```
my-app/
  loom.config.ts        entry, routes, styles, prerender
  src/app.ts            the app: nav + lazily loaded pages
  src/bootstrap.ts      the browser entry: dev reload, prime + hydrate
  src/prerender.entry.ts  the server module: renders one route
  src/routes.ts         the route list the config and prerender read
  src/pages/            home and about
  public/styles/base.css
```

Then `cd my-app` and run the `dev` script. The README the scaffold writes names every script with your package manager's commands.

## Choices

In a terminal, every choice you don't pass as a flag is prompted for. With `--yes`, or when stdin isn't a terminal, unanswered choices take their defaults.

| Flag                                  | Default      | What it does                                                                                                                                                                      |
| ------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[directory]`                         | `loom-app`   | Where to create the app. Must be new or empty (a lone `.git` is fine). The package name is its basename, lowercased.                                                              |
| `--layout <single\|monorepo>`         | `single`     | `monorepo` puts the app at `apps/web` under workspaces, with an empty `packages/` and root scripts that run through the task runner.                                              |
| `--task-runner <turbo>`               | `turbo`      | The monorepo's task runner. Implies `--layout monorepo`.                                                                                                                          |
| `--spa`                               | server-first | Client-only rendering: no server module, empty shells, `init` instead of `hydrate`.                                                                                               |
| `--ui <none\|pink>`                   | `none`       | A UI kit. `pink` adds `@loom-js/pink`, its stylesheets and theme class, and a home page built from pink components.                                                               |
| `--tailwind`                          | off          | Tailwind CSS v4. `build` compiles the stylesheet first; `dev` keeps the Tailwind CLI watching next to `loom dev`. With a UI kit, Tailwind's utilities win over the kit.           |
| `--formatter <none\|biome\|prettier>` | `biome`      | `format` / `format:check` scripts. Biome also sorts imports. Prettier comes plain, with no plugins.                                                                               |
| `--js`                                | TypeScript   | JavaScript instead: no `tsconfig.json`, no `type-check`, a `jsconfig.json` with the same `@app/*` alias.                                                                          |
| `--git <new\|none\|url>`              | `new`        | `new`: `git init` and one commit. `<url>`: clone the repository and scaffold on top (its `README.md`, `LICENSE` and `.gitignore` are kept; any other clash aborts). Never pushes. |
| `--install`, `--no-install`           | install      | Installs with the package manager that ran the command.                                                                                                                           |

## Versions

The scaffold depends on the `@loom-js` versions this release of `@loom-js/create` was tested against, as caret ranges. Every combination of choices is built and type-checked against them before release.
