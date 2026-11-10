# @loom-js/create

## 0.1.1

### Patch Changes

- 0d73a7a: Published from CI through npm trusted publishing, with a provenance attestation. No code changes.

## 0.1.0

### Minor Changes

- 2f0b25d: New package: `npm create @loom-js` (or `npx @loom-js/create`, `pnpm create @loom-js`, `yarn create @loom-js`, `bun create @loom-js`) scaffolds a standalone loom app that builds with `@loom-js/build`. Defaults: a single app, server-first (every route prerendered, then hydrated), TypeScript, Biome formatting, a new git repository with one commit, and dependencies installed. Options: `--layout monorepo` (the app at `apps/web`, with `--task-runner turbo`), `--spa`, `--ui pink`, `--tailwind`, `--formatter biome|prettier|none`, `--js`, `--git new|none|<url>` and `--no-install`. Unanswered choices are prompted for in a terminal.
