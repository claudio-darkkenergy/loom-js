# Design — loom-dev-parity

## Context

```
                 esbuild (client + static/js/prerender)    load bundle   setup   routes→render→validate   after
loom build prod  ✅                                         ✅            ✅      ✅                        ✅
loom build dev   ✅                                         ❌            ❌      ❌                        ❌
loom dev         ✅ watch + serve                           ❌            ❌      ❌                        ❌
```

- `loom dev` (`packages/build/src/dev.ts`) already builds `static/js/prerender.js` when `prerender` is configured, because `createBuildOptions` adds the entry in every mode. Nothing loads it.
- `prerender()` (`src/prerender.ts`) is one function: load bundle → `setup` → `routes` → shells → render/validate/inject → `after`. `after` is the only place an app generates files.
- Measured on `apps/loom` under `loom dev` (2026-10-22): `/static/search/index.json`, `/llms.txt` and `/llms-full.txt` all return `200 text/html` (the SPA fallback shell). `/static/bench/latest.json` is served because it goes through `copy`, which runs in every mode. Every route is the empty shell, so `bootstrap.ts`'s prime-then-hydrate path never runs in dev.
- Production behaves the same for a missing file: Vercel rewrites `/(.*)` to `/shell.html`, so dev's fallback already matches. The gap is missing files, not fallback rules.
- Content source: the dev bundle is compiled with dev defines, so `__CTF_IS_PREVIEW__` comes from `.env.local`. Build-time queries pass `isPreview` the same way the pages do, and the proxy uses the same `CTF_TOKEN`. Files generated in dev therefore match the content the dev pages show. Root `pnpm dev` loads `.env.local` through dotenvx. `pnpm -F @loom-js/loom dev` alone does not.
- `apps/loom`'s `setup` throws without `CTF_SPACE_ID`/`CTF_TOKEN` and also reads `apps/bench/results/latest.json`, throwing when it is missing. Only route rendering (`/benchmarks` and its validation) needs the bench results.

## Goals / Non-Goals

**Goals:**

- Any file a config generates from its prerender bundle exists in `loom dev` at the same path as in the build, and stays current with source edits.
- Prerendered pages and hydration can be tested by hand with live reload.
- Dev never dies because of a hook. The build stays strict.
- A general build-tool feature: nothing in `packages/build` knows about search, llms or Contentful.

**Non-Goals:**

- Changing the SPA fallback (dev matches production already).
- Watching Contentful for content changes. That needs webhooks or polling; refreshing on demand covers it.
- Hot module replacement. Live reload stays as it is.
- Generating files for apps without a `prerender` section. Generation needs a node-side bundle, and sandbox has none.

## Decisions

### D1 — `after` becomes `artifacts`, and it runs in every mode

`after` describes when it runs ("after routes"). The new name describes what it is for (files derived from the bundle), and it no longer depends on route rendering. Its context gains `mode` so a hook can branch, for example to skip something costly in dev. This is a clean break with no `after` alias, per the repo's no-deprecation-alias rule. `@loom-js/build` is 0.x, so it ships as a minor.

_Alternative:_ keep `after` and also run it in dev. Rejected: the name implies rendered routes exist, and they don't in dev. A hook that needs rendered HTML would quietly break there.

_Alternative:_ a top-level `artifacts` key outside `prerender`. Rejected: it needs the prerender bundle, and splitting the bundle's config from its only consumers adds a second place to look.

### D2 — `prerender()` is split into load, setup, render and artifacts

`src/prerender.ts` gets internal steps (`loadBundle`, `runSetup`, `renderRoutes`, `runArtifacts`) that `build`, `prerender` and `dev` compose:

```
loom build (prod)       load → setup → renderRoutes → artifacts
loom build (dev mode)   load → setup → artifacts
loom prerender          load → setup → renderRoutes → artifacts
loom dev                load → setup → artifacts                 (start, each rebuild, `r`)
loom dev --prerender    load → setup → renderRoutes → artifacts  (start, each rebuild, `r`)
```

`setup` runs on every load, because a fresh bundle import means fresh module state (transport config, seeded data).

### D3 — Each dev run happens in a fresh worker thread

Node caches ESM by URL. A cache-busting query on `prerender.js` alone isn't enough: its shared chunks are content-hashed, so an unchanged chunk keeps its URL and its module state. That includes core's resource cache, so `r` would serve the previous run's Contentful data. Each dev run therefore happens in a new `node:worker_threads` worker. The worker loads the config (`loadConfig` + `resolveConfig`, so a hook edit in the config takes effect on the next run (`r` or a rebuild) without a restart; options esbuild consumes still need one), imports the bundle, runs the steps, reports success or failure, and exits. The main dev thread only schedules runs and prints results. That also gives memory isolation (nothing accumulates across runs), and a hook that crashes or leaves handles open can't take down the server.

_Alternative:_ import with `?v=<counter>` in the main thread. Rejected for the shared-chunk state above and the growing module cache.

_Alternative:_ spawn `loom prerender` as a child process. Same isolation, but it costs a process start per run and needs a CLI flag to skip routes. A worker reuses the in-process API.

### D4 — When dev regenerates: start, every successful rebuild, and `r` + Enter

The runner hangs off an esbuild `onEnd` plugin (dev only) and skips builds with errors. Runs are coalesced: if a rebuild lands mid-run, one more run is queued, never more, and runs never overlap. Regenerating on every rebuild costs `apps/loom` about two Contentful passes over ~20 topics (a few seconds, off the request path). Filtering to rebuilds that touched the prerender bundle's inputs (using the metafile) was considered and dropped: it adds a dependency graph walk to save background seconds. `r` + Enter on stdin handles content-only changes (a Contentful edit). The listener is attached only when stdin is a TTY, so CI and piped runs are unaffected.

Live reload fires when esbuild finishes, before regeneration does. The browser can briefly see the previous file. That is fine in dev, and the next reload or palette reopen picks up the new one.

### D5 — `loom dev --prerender` is opt-in, and it rebuilds the shells it injects

Rendering every route on every rebuild is too slow to be the default, but it is the only way to watch hydration. With the flag, each run first deletes the `shell.html` files left by the previous run. esbuild has just rewritten every `index.html` as a pristine shell with the current chunk names, so the shell-preservation step copies fresh ones. Without this, the previous run's `shell.html` would point at stale dev chunk names. The flag is CLI-only, not a config key: it is a per-session choice, like `--outDir`.

### D6 — Dev failures warn and keep the last good files

`setup`, `routes`, `validate`, `artifacts` and route renders are each wrapped in dev. An error prints `[loom dev] <hook> failed: <message>`, and the server keeps serving. Previously written files are not deleted: stale is more useful than missing while you fix the error, and the warning says the files are from the last good run. `loom build` and `loom prerender` keep throwing.

### D7 — `apps/loom` moves bench handling out of `setup`

`setup` keeps only the Contentful transport. Reading, seeding and capturing framework names for the bench results moves into `routes`, the only phase whose renders and validation use them. Plain `loom dev` then needs only Contentful credentials. A fresh clone without bench results can still use search and llms in dev, and `/benchmarks` keeps reading `latest.json` through `copy` as it does today. The setup error drops "production" from its message.

### D8 — Overlap with `loom-devtools`

`loom-devtools` (uncommitted, in flight) edits `packages/build/src/config.ts`, `src/prerender.ts`, `src/esbuild-options.ts`, `tests/build.test.mjs`, `docs/topics/15-build-tool.md` and CLAUDE.md. This change touches the first, second, fourth, fifth and sixth of those, plus `src/dev.ts`, `src/cli.ts` and `src/build.ts`, which devtools does not touch. The changes don't conflict in behavior: devtools adds a config key and esbuild plugins, and this change reshapes the prerender phase. Recommendation: land `loom-devtools` first, then apply this change on top. Apply should start from the tree after devtools lands, not from today's HEAD.

## Risks / Trade-offs

- [Contentful calls on every rebuild] → coalesced and off the request path. A hook that wants less can branch on `mode`.
- [Stale files after a failed run] → the warning says so. A successful run overwrites them.
- [Worker start-up per run] → tens of milliseconds next to the hooks' network time.
- [Hooks run off the main thread] → hooks already run in Node with no shared state beyond the module (the build loads them through the same loader), so nothing changes for config authors.
- [`--prerender` rewrites shells while the browser reloads] → live reload can land between esbuild's write and the injection, showing the empty shell once. The next reload shows the rendered page. Documented in the topic.
- [Breaking rename] → two in-repo users (`apps/loom`, the build fixture) are updated in the same change. The changeset names the rename.

## Migration Plan

Rename `prerender.after` to `prerender.artifacts` in each config. Configs that throw in `setup` for missing build-only inputs should move those reads to the phase that uses them (see D7). Rollback is `git revert`.
