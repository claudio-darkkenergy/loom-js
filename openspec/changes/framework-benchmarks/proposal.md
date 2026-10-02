# Framework Benchmarks

## Why

Loom's pitch is "micro DOM updates" and "lightweight", but the docs site offers no numbers — a visitor has to take the home page's word for it. A `/benchmarks` page that measures loom next to react, vue, svelte, solid and a vanilla-JS floor, on the same machine in the same run, turns the claim into something checkable and gives core work a regression gauge.

## What Changes

- **New workspace `apps/bench` (`@loom-js/bench`)** — one benchmark app (js-framework-benchmark shape: 1k-row table with create / replace / partial-update / select / swap / remove / clear) implemented once per framework: loom, react, vue 3, svelte, solid and vanilla JS. Each build is a separate esbuild bundle through the framework's idiomatic compiler path.
- **A puppeteer runner** (`pnpm -F @loom-js/bench bench`) — drives every bundle in headless Chrome and writes `results/latest.json`: per-op durations (median of repeated samples), bundle size (raw + gzip), startup time and heap after 1k rows, plus the environment and the exact framework versions measured.
- **Turbo-cached measurement** — a `bench` task whose inputs are the bench sources, its manifest (framework versions) and core's `build-package` output. `@loom-js/loom#build` depends on it; the measurement reruns only when a framework version or loom core changes, otherwise the loom build restores the cached results. Rendering the page from results is part of every build and is cheap.
- **`pnpm bench:update`** — bumps the competitor frameworks to their latest npm releases in the bench manifest (lockfile included). The committed bump is what changes the task inputs; nothing resolves versions at build time.
- **`/benchmarks` route in `apps/loom`** — prerendered like every other route: a per-op table with vanilla-relative multipliers, bundle / startup / memory comparisons, the methodology, and an environment + versions caption. Linked from the site header.
- **Vercel build support** — the runner launches puppeteer's Chrome locally and falls back to a Lambda-compatible Chromium on the Vercel builder, where Chrome's shared libraries are absent.

## Capabilities

### New Capabilities

- `benchmark-suite`: the bench app contract — the operations every implementation performs, parity rules between implementations, the framework set and how each is built.
- `benchmark-measurement`: the runner — how each metric is measured, sampled and aggregated, the results schema, environment capture, and what fails a run.
- `benchmark-build-caching`: when measurement reruns and when it is restored — the turbo task inputs/outputs, the loom build dependency, and the version-bump script.
- `benchmarks-page`: what the `/benchmarks` page shows and how it is reached — tables, relative values, methodology, caption, header link, and the data path from results to prerender and hydration.

### Modified Capabilities

- `app-prerendering`: the prerendered route set gains `/benchmarks`, rendered from the bench results with its own output validation; `/benchmarks` is a fixed route, not a content-source discovery.
- `app-edge-caching`: `/benchmarks` is served as static prerendered output, and the immutable-cache header covers its route chunk prefix.

## Impact

- New workspace `apps/bench`: framework deps (`react`, `react-dom`, `vue`, `svelte`, `solid-js`), compiler plugins (`esbuild-svelte`, `esbuild-plugin-solid`; vue SFCs compile through `vue/compiler-sfc` in a small in-repo esbuild plugin — `unplugin-vue` was rejected for pulling in vite), `puppeteer`, `@sparticuz/chromium` + `puppeteer-core` for Vercel, `esbuild`, `tsx`.
- `apps/loom`: new route (`RoutePath.Benchmarks`), page module + components, a results resource with dehydrated state, header nav link, `loom.config.ts` (`routes`, `copy`, `prerender.setup` / `routes` / `validate`, `html.title`), `vercel.json` header regex.
- `turbo.json`: `@loom-js/bench#bench` task; `@loom-js/loom#build` gains the dependency.
- Root `package.json`: `bench` and `bench:update` scripts. `.prettierrc` `packageJSONFiles` gains `apps/bench/package.json`. `.claude/skills/skill-config.md` records the new workspace.
- Vercel: build time grows by the measurement only on cache misses; preview deploys exercise the Chromium fallback.
- No published package changes; no changeset.
