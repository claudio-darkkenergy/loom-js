# Design — framework-benchmarks

## Context

```
pnpm bench:update ──bump──► apps/bench/package.json + lockfile ──commit──► turbo input change
                                                                                   │
core src change ──► @loom-js/core#build-package (dist) ──^build-package──► @loom-js/bench#bench ──► results/latest.json
                                                                                   │ (cached: restore)
                                                            @loom-js/loom#build ◄──┘
                                                               esbuild copy ──► build/static/bench/latest.json
                                                               prerender ──seed──► /benchmarks/index.html + dehydrated state
```

The docs app is an SSG'd loom SPA built by `@loom-js/build` (`loom build` over `apps/loom/loom.config.ts`): esbuild + `htmlSplit` shells, then the tool's prerender phase renders each route the config's `prerender.routes` hook enumerates against linkedom and injects markup + `serializeState` output, with `prerender.setup` / `validate` / `after` as the app hooks. Data reaches pages through resources with dehydrated state (`page-content.ts`); the prerender bundle is handed a transport in `setup` so it settles without the `/api` proxy. Puppeteer is already a repo dependency (core tests) and `allowBuilds` whitelists it. `@loom-js/loom#build` is uncached because of Contentful; every other task caches, and Vercel builds use Vercel's remote cache automatically. Constraints: the shell contract, output layout, `vercel.json` static-first serving and the turbo graph stay as `app-prerendering`, `app-edge-caching`, `app-asset-delivery` pin them. (`loom-build-tool` landed 2026-10-02, between this proposal and its apply — D7/D8 target the config hooks.)

## Goals / Non-Goals

**Goals:**

- One bench app, six implementations (loom, react, vue 3, svelte, solid, vanilla), identical data and markup, each built the way its framework expects.
- Numbers come from one run on one machine; the page shows absolute medians and vanilla-relative multipliers, and says where and when they were measured.
- Measurement reruns only when a framework version or loom core changes; everything else restores from the turbo cache.
- Competitor versions are bumped by a script that produces a reviewable commit — nothing resolves `latest` at build time.
- The loom implementation is idiomatic loom. A slow number is a core finding, not a bench-tuning task.

**Non-Goals:**

- Running benchmarks in the visitor's browser.
- Paint-accurate timing (Chrome tracing). The method is disclosed on the page instead.
- Historical trends / per-commit charts — `latest.json` is the only artifact.
- Benchmarking the docs app itself (Lighthouse etc.).
- A sandbox counterpart.

## Decisions

### D1 — `apps/bench` is a workspace with one bench app per framework, driven like a user would

```
apps/bench/
  src/shared/        data.ts (seeded rows: adjective-colour-noun), markup contract, markReady()
  src/apps/<fw>/     entry + components; index.html shell per framework
  src/runner/        build.ts (esbuild, one bundle per fw, metafile) · measure.ts (puppeteer) · write.ts (schema + validate)
  src/types.ts       BenchResults — the one type the loom app imports
  results/latest.json  (turbo output, gitignored)
```

Every implementation renders the same DOM: a toolbar of buttons with fixed ids (`run`, `runlots`, `add`, `update`, `clear`, `swaprows`) and a `<table>` of keyed rows with a select link and a remove button, the js-framework-benchmark layout. The runner only clicks those ids and asserts on the DOM afterwards (row count, selected-row class, swapped ids), so no framework exposes a hook and a broken or cheating implementation fails the run. Rows come from one seeded generator in `shared/` so labels are identical across frameworks.

Parity rules: keyed rows; idiomatic framework code with the optimizations a typical app ships (react `memo` rows, solid `<For>`, svelte 5 runes, vue `<script setup>` + `v-for :key`, loom `activity` array + `component`); no manual DOM manipulation outside the framework; no framework-specific scheduler hacks.

_Alternative rejected:_ vendoring js-framework-benchmark's harness — it brings webdriver, its own build tooling and a results format shaped for its own site; this repo needs six bundles and one JSON.

### D2 — Each framework compiles through its own esbuild path, loom through core's `dist`

| fw      | build                                                                      | version source               |
| ------- | -------------------------------------------------------------------------- | ---------------------------- |
| loom    | tagged templates, `@loom-js/core` workspace dep (`^build-package`)         | `packages/core/package.json` |
| react   | esbuild JSX automatic runtime                                              | `react/package.json`         |
| vue 3   | in-repo esbuild plugin over `vue/compiler-sfc` (SFC → optimized render fn) | `vue/package.json`           |
| svelte  | `esbuild-svelte` (svelte 5)                                                | `svelte/package.json`        |
| solid   | `esbuild-plugin-solid` (babel-preset-solid)                                | `solid-js/package.json`      |
| vanilla | plain TS                                                                   | none                         |

Prod settings for all: `minify`, `format: 'esm'`, `bundle`, `metafile`, no sourcemap. The loom bundle resolves `@loom-js/core` to the built `dist/` (package `exports`), which is why the task depends on `^build-package` and why a core change busts the cache.

Type-checking: the runner, shared code, loom and vanilla apps use the workspace tsconfig; `react` and `solid` get a per-directory tsconfig for their `jsxImportSource`; vue and svelte components are checked by their compilers during the bench build. `type-check` runs all three configs.

### D3 — Measurement method: click → settled frame, repeated, interleaved, medians

- **DOM ops** (`createRows` 1k, `replaceAll` 1k, `partialUpdate` every 10th, `selectRow`, `swapRows`, `removeRow`, `clearRows`, `appendRows` 1k to 1k): `page.evaluate` records `performance.now()`, clicks the button, drains the microtask queue (vue and svelte commit in a microtask; the others are synchronous), forces a synchronous layout (`tbody.getBoundingClientRect()`) and records again — script + style + layout, no vsync idle. 5 warmup + 15 measured samples per op per framework; one page per framework per op, brought to the foreground before every sample (Chrome throttles background tabs ~10×); each sample resets state the same way (clear then create for ops needing rows).
- **Startup**: fresh navigation; each app calls `markReady()` once its initial UI has mounted (`performance.mark`); startup = mark − `navigationStart`. 10 samples.
- **Memory**: after `createRows`, `HeapProfiler.collectGarbage` then `Performance.getMetrics().JSHeapUsedSize`. 5 samples.
- **Bundle**: the framework's JS entry output bytes from the esbuild metafile, plus gzip (`zlib.gzipSync`, level 9) of the emitted file. Shared CSS is identical and excluded.
- **Order**: for each sample index, frameworks rotate (round-robin), so drift and thermal noise spread evenly instead of favoring whoever ran first.
- **Aggregation**: `median` plus the raw `samples` array per metric. The page shows medians; samples stay in the JSON for anyone who wants spread.

_Alternatives rejected:_ Chrome tracing (click → last paint, as js-framework-benchmark does) — more faithful, but it needs trace parsing per Chrome version and is the piece that breaks most often there. `requestAnimationFrame` → `setTimeout(0)` — measured 2026-10-02: adds up to a frame of idle to every sample, inflating the sub-5 ms ops with pure waiting. The forced-layout method applies the same bias to every framework and is disclosed on the page.

### D4 — Results schema and run validation

```ts
interface BenchResults {
    schemaVersion: 1;
    generatedAt: string; // ISO
    environment: {
        platform;
        arch;
        cpuModel;
        cpus;
        memoryGb;
        chrome;
        node;
        runner: 'local' | 'vercel' | 'github';
    };
    frameworks: Array<{
        id: 'loom' | 'react' | 'vue' | 'svelte' | 'solid' | 'vanilla';
        name: string;
        version: string | null; // vanilla: null
        bundle: { bytes: number; gzipBytes: number };
        startupMs: Metric;
        heapBytes: Metric;
        ops: Record<OpId, Metric>;
    }>;
}
interface Metric {
    median: number;
    samples: number[];
}
```

The runner fails (non-zero exit, no `latest.json` written) when any DOM assertion fails, any framework bundle fails to build, or a sample is non-finite. `write.ts` validates the object against the schema before writing — the loom build never reads a half-written file. Versions are read from the installed packages, not the manifest range.

### D5 — Caching is turbo's; the bump is a commit

```json
"@loom-js/bench#bench": {
    "dependsOn": ["^build-package"],
    "outputs": ["results/**"]
},
"@loom-js/loom#build": { "dependsOn": ["^build", "^build-package", "@loom-js/bench#bench"], "cache": false, ... }
```

Default inputs cover the bench sources and manifest; turbo also hashes the workspace's resolved lockfile subgraph, so a version bump is a miss. `^build-package` folds core's output hash in, so a core change is a miss. No `env` is declared — the Chromium choice (D6) must not split the cache between machines. Hits restore `results/latest.json`; misses measure (minutes). `turbo build` locally runs the bench once per input state, then hits.

`pnpm bench:update` = `pnpm -F @loom-js/bench update --latest react react-dom vue svelte solid-js esbuild-svelte esbuild-plugin-solid` and prints the before/after versions. The result is manifest + lockfile changes to commit; the next build misses the cache and remeasures. A scheduled workflow can call it later; not part of this change.

_Alternative rejected:_ a build-time script that fetches npm `latest` and compares against a stored version file — it either mutates the lockfile during a frozen install or measures a version the lockfile does not pin, and neither is reproducible.

### D6 — Chrome: puppeteer's locally, `@sparticuz/chromium` on Vercel

`measure.ts` launches `puppeteer` (bundled Chrome for Testing) unless `process.env.VERCEL === '1'`, where it launches `puppeteer-core` with `@sparticuz/chromium`'s executable and args — Vercel's AL2023 builder lacks Chrome's shared libraries, and sparticuz ships them. The Chrome version lands in `environment.chrome` either way. A root `.puppeteerrc.cjs` skips puppeteer's Chrome download when `VERCEL=1` (and Firefox everywhere), so the Vercel install never fetches a browser it will not launch — no dashboard setting involved. `runner` is `vercel` / `github` (`GITHUB_ACTIONS`) / `local`.

Verification is a preview deploy with a deliberate cache miss (a bench source touch). If the builder cannot launch Chromium, the fallback is a GitHub Actions job (`ubuntu-latest` has Chrome) running `turbo run bench` with `TURBO_TOKEN`/`TURBO_TEAM` into the same remote cache before Vercel builds — decided now so the apply does not stall on it.

### D7 — Results reach the page as a resource with dehydrated state

- Build: `loom.config.ts` `copy` gains `{ from: '../bench/results/latest.json', to: './static/bench' }`.
- Client: `useBenchResults()` — a resource keyed `bench:results` fetching `/static/bench/latest.json`; SPA navigation to `/benchmarks` fetches it, a direct load hydrates it from the state script.
- Prerender: the config's `prerender.setup` hook reads `apps/bench/results/latest.json` (failing the build by name if absent or invalid) and passes it to a new `seedBenchResults(results)` export of the prerender bundle, which primes the resource so the route settles without network; `prerender.routes` adds `/benchmarks`; the key rides the dehydrated state like `page-content`.
- Validation: `prerender.validate` checks the emitted HTML contains every `frameworks[].name` and the state contains `bench:results`.

_Alternative rejected:_ importing the JSON into the page module — `type-check` of the loom app would then need a file only the bench task produces, so a fresh clone could not type-check without running a benchmark.

### D8 — The page

`RoutePath.Benchmarks = '/benchmarks'`, lazy page module `@/app/pages/benchmarks/`, `loom.config.ts` `routes` gains `/benchmarks` (scope `/benchmarks`, `html.title` → `Benchmarks | Loomjs`), header gets a "Benchmarks" link, `vercel.json` header regex gains the `benchmarks` chunk prefix. Sections:

1. Lead: what is compared, one sentence on how, and the caption (machine, Chrome, date, versions).
2. DOM operations table: rows = ops, columns = frameworks (vanilla first, then by geometric mean of vanilla-relative ratios), cell = `median ms` + `×vanilla`; last row = geometric mean. Cells shaded by ratio.
3. Bundle size (gzip, raw) — horizontal CSS bars.
4. Startup and memory — two small tables with the same ×vanilla treatment.
5. Methodology: the D3 method in plain sentences, what it does and does not capture, link to `apps/bench` on GitHub.

Pink table and layout primitives; bars are CSS, no charting dependency. Copy follows the docs-copy rules (plain sentences, no metaphors). Load the `dataviz` skill before writing the shading/bar components.

## Risks / Trade-offs

- [Shared builders are noisy; absolute ms drift between runs] → interleaved sampling, medians, vanilla-relative multipliers as the headline, environment caption on every result.
- [sparticuz Chromium fails to launch on the Vercel builder] → preview-deploy verification task; fallback decided in D6 (GitHub Actions + remote cache).
- [Cache miss adds minutes to a Vercel build] → sample counts bounded (D3); only version bumps and core changes miss; Contentful publishes hit.
- [Forced-layout timing excludes paint and compositing] → disclosed in Methodology; same bias for every framework.
- [`bench:update` pulls a major that breaks an implementation or its esbuild plugin] → the bench build fails before measurement; the bump is a reviewed commit, fix the implementation in the same commit.
- [Loom measures poorly] → that is the gauge working; the implementation stays idiomatic and the number goes to core.
- [`loom-build-tool` landed first] → happened; D7/D8 and tasks 5.x target `loom.config.ts` hooks.
- [Local `turbo build` now runs a benchmark on first run] → one-time per input state; `pnpm -F @loom-js/loom build` alone still requires it, documented in CLAUDE.md.

## Migration Plan

1. Land `apps/bench` + runner; `pnpm bench` produces `results/latest.json` locally.
2. Wire `turbo.json`; confirm a second `turbo run bench` hits the cache and a core edit misses.
3. Add the loom route, resource, prerender seed + validation, static copy, header link, `vercel.json` regex.
4. Preview deploy with a forced miss; confirm `/benchmarks` renders measured numbers with `runner: 'vercel'`.
5. Rollback: revert the commit — `@loom-js/loom#build` loses the dependency and the route together.

## Open Questions

None. The Vercel Chromium fallback (D6) is pre-decided.
