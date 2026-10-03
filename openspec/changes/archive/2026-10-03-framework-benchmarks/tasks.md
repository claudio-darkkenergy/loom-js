# Tasks — framework-benchmarks

## 1. Workspace

- [x] 1.1 Scaffold `apps/bench` (`@loom-js/bench`, private): `package.json` (scripts `bench`, `build-bench`, `type-check`; deps per design D2 + `puppeteer`, `puppeteer-core`, `@sparticuz/chromium`, `esbuild`, `tsx`), tsconfig extending `@loom-js/typescript-config`, `results/` gitignored
- [x] 1.2 Add `apps/bench/package.json` to `.prettierrc` `packageJSONFiles`; add root scripts `bench` (`turbo run bench`) and `bench:update` (D5)
- [x] 1.3 `src/types.ts`: `BenchResults`, `Metric`, `OpId`, `FrameworkId` (D4); export from the package entry so the loom app can import types only

## 2. Bench app — shared + implementations

- [x] 2.1 `src/shared/`: seeded row generator (adjective-colour-noun), `markReady()`, the DOM contract constants (button ids, row/table classes), one shared stylesheet
- [x] 2.2 Vanilla implementation (`src/apps/vanilla/`) — keyed rows, the floor
- [x] 2.3 Loom implementation — `activity` array + `component`, declarative only (parity rules, spec `benchmark-suite`)
- [x] 2.4 React implementation — hooks + `memo` rows, keyed; per-dir tsconfig (`jsx: react-jsx`)
- [x] 2.5 Vue 3 implementation — `<script setup>` SFC, `v-for :key`
- [x] 2.6 Svelte 5 implementation — runes, keyed `{#each}`
- [x] 2.7 Solid implementation — `<For>`, signals; per-dir tsconfig (`jsxImportSource: solid-js`)
- [x] 2.8 One `index.html` shell per framework under the build output; every app calls `markReady()` once after mount

## 3. Runner

- [x] 3.1 `src/runner/build.ts`: esbuild one prod bundle per framework through its compiler plugin, `metafile` on; loom resolves `@loom-js/core` `dist/`; fails naming a framework whose entry is missing
- [x] 3.2 `src/runner/chrome.ts`: launch selection — puppeteer locally, `puppeteer-core` + `@sparticuz/chromium` when `VERCEL=1`; record Chrome version and `runner`
- [x] 3.3 `src/runner/measure.ts`: ops with click-to-settled-frame timing, DOM assertions per op, 5 warmup + 15 samples, fresh page per op, round-robin across frameworks (D3)
- [x] 3.4 Startup (`bench:ready` mark, 10 loads), heap after `createRows` + GC (5 samples), bundle bytes + gzip from metafile/output
- [x] 3.5 `src/runner/write.ts`: aggregate medians, read installed versions, capture environment, validate against `BenchResults`, write `results/latest.json`; any failure → non-zero exit, no file
- [x] 3.6 `node --test` unit tests for the pure parts: median/geomean helpers, schema validation, version reading, round-robin scheduler
- [x] 3.7 Run `pnpm -F @loom-js/bench bench` locally; inspect `latest.json` for sanity (vanilla fastest or near, all ops present, 15 samples each)

## 4. Turbo wiring

- [x] 4.1 `turbo.json`: `@loom-js/bench#bench` (`dependsOn: ["^build-package"]`, `outputs: ["results/**"]`, no `env`); `@loom-js/loom#build` adds `@loom-js/bench#bench` to `dependsOn`
- [x] 4.2 Verify: second `turbo run bench` hits; edit under `packages/core/src` misses; `pnpm bench:update`-style manifest change misses; revert test edits
- [x] 4.3 `pnpm bench:update` prints before/after versions and leaves only manifest + lockfile changes

## 5. Loom app — route and data

- [x] 5.1 `RoutePath.Benchmarks = '/benchmarks'`; `createRoutes` config + assets entry; `loom.config.ts` `routes` gains `/benchmarks` and `html.title` returns `Benchmarks | Loomjs` for it
- [x] 5.2 `loom.config.ts` `copy` adds `../bench/results/latest.json` → `static/bench/`
- [x] 5.3 `logic/activity/bench-results.ts` + `useBenchResults()` hook: resource key `bench:results`, fetch `/static/bench/latest.json`, typed by `@loom-js/bench` types
- [x] 5.4 Prerender: `prerender.entry.ts` exports `seedBenchResults(results)`; `loom.config.ts` `prerender.setup` reads `apps/bench/results/latest.json` (fails naming the file if absent/invalid) and seeds; `prerender.routes` adds `/benchmarks`; `prerender.validate` checks every framework name in HTML and `bench:results` in state
- [x] 5.5 Header nav gains a Benchmarks link using `route`
- [x] 5.6 `apps/loom/vercel.json` immutable header regex gains `benchmarks`

## 6. Loom app — page

- [x] 6.1 Load the `dataviz` skill; page module `pages/benchmarks/` with layout: lead + caption, ops table, bundle bars, startup/memory tables, methodology
- [x] 6.2 Pure helpers (`pages/benchmarks/lib/`): vanilla ratios, geometric mean, column ordering, byte/ms formatting — `node --test` covered under `project/client/tests`
- [x] 6.3 Ops table component: vanilla first, geomean ordering, `median ms` + `×` per cell, geomean row, ratio shading
- [x] 6.4 Bundle bars (CSS, proportional) and startup/memory tables
- [x] 6.5 Caption (date, environment, versions) and Methodology copy per docs-copy rules, link to `apps/bench` on GitHub
- [x] 6.6 Prerender output for `/benchmarks`: skeleton-free, hydrates without a `results.json` request; SPA nav from `/` fetches once

## 7. Verification and housekeeping

- [x] 7.1 `pnpm type-check`, `pnpm format:check`, `pnpm -F @loom-js/bench test-ci`, `pnpm -F @loom-js/loom test-ci`, full `pnpm build` from a clean turbo cache
- [x] 7.2 Preview deploy with a forced bench miss (`.puppeteerrc.cjs` already skips the Chrome download on Vercel); confirm `/benchmarks` shows `runner: vercel` numbers — if Chromium fails to launch, implement the D6 fallback (GitHub Actions `turbo run bench` into the remote cache)
- [x] 7.3 Update `.claude/skills/skill-config.md` (new workspace, bench task, results path) and CLAUDE.md (`apps/bench`, `pnpm bench`, `bench:update`, first-build cost)
- [x] 7.4 Check `SOLID-AUDIT-REPORT.md` for open violations in touched loom files before editing them
