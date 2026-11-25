## 0. Before starting

- [x] 0.1 Confirm `loom-devtools` has landed (or rebase this change onto its tree); start from that tree, not today's HEAD (design D8)
- [x] 0.2 Check `SOLID-AUDIT-REPORT.md` for open violations in `packages/build/src/{prerender,dev,cli,build,config}.ts` and `apps/loom/loom.config.ts`; resolve any 🔴 before adding code

## 1. Hook rename and phase split (`@loom-js/build`)

- [x] 1.1 `src/config.ts`: replace `PrerenderOptions.after` with `artifacts(context)`; `PrerenderContext` gains `mode: Mode`; doc blocks say when each hook runs per command
- [x] 1.2 `src/prerender.ts`: split into `loadBundle` / `runSetup` / `renderRoutes` / `runArtifacts`; `prerender(config)` composes load → setup → render → artifacts, unchanged output otherwise
- [x] 1.3 `src/build.ts`: development-mode builds with `prerender` configured run load → setup → artifacts; production unchanged apart from the rename
- [x] 1.4 Fixture: `tests/fixtures/app/prerender-hooks.ts` `after` → `artifacts`, writing `artifacts.txt` with the mode it received

## 2. Dev runner (`@loom-js/build`)

- [x] 2.1 Add the dev runner: a worker-thread entry that loads the config, imports the bundle, runs setup → artifacts (→ renderRoutes first with `--prerender`), and posts `{ ok }` or `{ hook, message }` (design D3)
- [x] 2.2 `src/dev.ts`: esbuild `onEnd` plugin (dev only) schedules a run after every error-free build; coalesce to one queued run, never overlapping (D4); log `[loom dev] <hook> failed: <message>` and keep serving (D6)
- [x] 2.3 `--prerender`: before each run, delete stale `shell.html` files so the shells are rebuilt from esbuild's fresh `index.html` (D5)
- [x] 2.4 stdin: when stdin is a TTY, `r` + Enter schedules a run; with no `prerender` section, `r` and `--prerender` print that there is nothing to run
- [x] 2.5 `src/cli.ts`: parse `--prerender` (dev only; reject it on other commands), update `USAGE`

## 3. Tests (`pnpm -F @loom-js/build test-ci`)

- [x] 3.1 Production build: `artifacts` runs after the routes are written with `mode: 'production'`; `loom prerender` re-runs it
- [x] 3.2 Development `loom build`: `artifacts.txt` exists with `development`; no route is rendered and no `shell.html` is written (replaces "never prerenders")
- [x] 3.3 `dev()`: start on a free port, poll for `artifacts.txt` over HTTP; edit a fixture source the prerender bundle imports and assert the served file changes; `artifacts` throwing logs a warning and the server keeps answering; stop the context
- [x] 3.4 `dev({ prerender: true })`: a fixture route is served with rendered markup and a state script; an unknown path gets the pristine shell
- [x] 3.5 Shared-chunk freshness: a value cached in a shared module is fresh on the next run (proves the worker isolation in D3)

## 4. Docs app (`apps/loom`)

- [x] 4.1 `loom.config.ts`: `after` → `artifacts`; move bench read, seed and framework-name capture from `setup` into `routes`; drop "production" from the setup error (D7)
- [x] 4.2 Dev smoke via root `pnpm dev`: the terminal logs the index and llms writes; `/static/search/index.json` and `/llms.txt` are served as JSON/text; ⌘K → query → Enter lands on a heading; edit a search-index source and see it regenerate; `r` + Enter regenerates; remove the CTF vars → a warning and the server stays up
- [x] 4.3 `loom dev --prerender` smoke: `/docs/<slug>` view-source shows rendered markup and a state script; the page hydrates without a flash; live reload still works
- [x] 4.4 Isolated production build (`LOOM_BUILD_DIR`): same index entry count, llms sizes and prerendered routes as before the change
- [x] 4.5 `pnpm -F @loom-js/loom type-check` and `test-ci`

## 5. Docs, config, hygiene

- [ ] 5.1 `docs/topics/15-build-tool.md`: CLI table (`loom dev` no longer "never prerenders"; `--prerender` flag), the dev section (generated files, regeneration triggers, `r`, warnings), the prerender hook list (`after` → `artifacts` with `mode`, the per-command table); push with `docs/contentful-sync/` and publish
- [x] 5.2 Re-grep `docs/topics/` for `after` (today only `15-build-tool.md` names it); update, push and publish anything else that turns up
- [x] 5.3 CLAUDE.md "App build patterns": the `after` hook line and a dev sentence (generated files are served in dev; `--prerender` for hydration testing; root `pnpm dev` supplies the CTF env)
- [x] 5.4 `.claude/skills/skill-config.md` if it lists build hooks or the build test harness
- [x] 5.5 Changeset: `@loom-js/build` minor naming the `after` → `artifacts` rename and the dev behavior
- [x] 5.6 `pnpm format:check`, `pnpm -F @loom-js/build -F @loom-js/loom type-check`, both `test-ci`s; pause for IDE diff review before commit
