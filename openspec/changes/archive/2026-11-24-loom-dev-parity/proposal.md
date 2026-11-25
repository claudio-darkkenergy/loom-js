# Proposal — loom-dev-parity

## Why

`loom dev` is meant to let you test everything you build, but every file an app generates in the prerender phase only exists after `loom build`. In the docs app the search palette shows "Search is unavailable" in dev, `/llms.txt` and `/llms-full.txt` come back as the HTML shell, and prerendered pages and the hydration path can't be watched at all. That makes some features impossible to test by hand without a full production build.

## What Changes

- **BREAKING** (`@loom-js/build`, pre-1.0 minor): `prerender.after` is replaced by `prerender.artifacts({ bundle, outDir, mode })`. It is the hook for files generated from the prerender bundle, and it runs everywhere output is produced: after route rendering in `loom build` and `loom prerender`, in a development `loom build`, and in `loom dev`. No alias for `after`.
- `loom dev` loads the prerender bundle it already builds. It runs `setup` and then `artifacts` on start and after every successful rebuild (runs coalesced, never overlapping), and again on demand when you type `r` + Enter in the terminal. It never renders routes by default.
- `loom dev --prerender` opts into the full prerender phase on start and after every rebuild. Routes get rendered markup and dehydrated state, so prerendered pages and hydration can be tested with live reload.
- In dev, a failing `setup`, `artifacts` or route render logs a `[loom dev]` warning and the server keeps serving. Files from the last good run stay in place. `loom build` still fails on the same errors.
- Dev imports a fresh copy of the prerender bundle after each rebuild, so hooks always see current code.
- `apps/loom`: the search index and llms files move into `artifacts`. Reading and seeding the bench results moves from `setup` into `routes`, so a missing results file only matters when routes are rendered. The setup error message no longer says "production".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-tool-prerender`: `after` becomes `artifacts`, which runs in every mode and command. The "Dev never prerenders" scenario becomes "dev renders no routes unless `--prerender`", and dev hook failures are warnings.
- `build-tool-config`: the dev server requirement gains artifact generation on start, rebuild and demand, the `--prerender` flag, and the keep-serving failure rule.
- `docs-search`: the index is written by the `artifacts` hook, so `loom dev` serves it as well as the production build.
- `docs-llms-text`: both files are written by `artifacts` and served by `loom dev` as well as the production build.

## Impact

- `packages/build`: `src/config.ts` (hook types), `src/prerender.ts` (split the bundle load and setup from route rendering, run `artifacts`, `mode` in the context), `src/dev.ts` (esbuild `onEnd` runner, stdin refresh, `--prerender`), `src/cli.ts` (flag and usage), `src/build.ts` (artifacts in a development build), tests and fixture. Minor changeset (breaking rename).
- `apps/loom/loom.config.ts`: `after` becomes `artifacts`, and the bench handling moves from `setup` to `routes`.
- Docs: the `build-tool` topic (dev section, CLI table, prerender hook list) is pushed and published to Contentful. CLAUDE.md "App build patterns" gets the same update.
- Overlaps with the in-flight `loom-devtools` change in `packages/build/src/config.ts`, `src/prerender.ts`, `tests/build.test.mjs`, `docs/topics/15-build-tool.md` and CLAUDE.md. Whichever change lands second rebases onto the other.
