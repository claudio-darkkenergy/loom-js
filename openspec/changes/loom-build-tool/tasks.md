# Tasks — loom-build-tool

## 1. Core boot contract (D5)

- [ ] 1.1 Move `apps/loom/src/app/boot-contract.ts` to `packages/core/src/boot-contract.ts`; export the ids/slots from `src/index.ts` and `injectPrerender` from `src/server.ts`; `node --test` spec for inject/throw/`$` safety
- [ ] 1.2 Point the loom app's `bootstrap.ts` and build at the core exports; delete the app module; `type-check` green

## 2. Plugin goes public (D6)

- [ ] 2.1 Move to `packages/esbuild-plugin-html-split`, rename to `@loom-js/esbuild-plugin-html-split`, drop `private`, `esbuild` → peerDep; update `pnpm-workspace.yaml`, `.prettierrc` `packageJSONFiles`, both app manifests and imports
- [ ] 2.2 Add rollup `build-package` (ES + CJS + `index.d.ts`, mirroring core), `exports` → `dist/`, `files`; `turbo.json` task wiring; `pnpm build-packages` green
- [ ] 2.3 Write the package README (options, `HtmlTemplateArgs`, chunk-classification rules)

## 3. `@loom-js/build` package (D1–D4)

- [ ] 3.1 Scaffold `packages/build`: manifest (`bin: loom`, deps `esbuild`, `linkedom`, `esbuild-plugin-copy`, the plugin), tsconfig from `lib.json`, rollup `build-package`; add to workspace/prettier/turbo
- [ ] 3.2 `defineConfig` + config types (bundler-neutral surface per D2) and the config loader (esbuild-bundle the config file, externals from nearest manifest, import)
- [ ] 3.3 `build(config)`: mode resolution, outDir wipe + overrides, esbuild assembly (entry/styles/defines/loaders/splitting), `publicDir`/`copy`, `esbuild(options)` escape hatch applied last
- [ ] 3.4 Default shell template (port of `template.html.mts`) with `html.title` / `html.head` / `html.bodyClass` / `html.template` layering
- [ ] 3.5 `dev(config)`: esbuild context, watch, serve with SPA fallback on `server.port`
- [ ] 3.6 `prerender(config)`: shell preservation, longest-prefix shell resolution, font preloads, per-route render via `prerenderRoute`, generic sanity checks, `setup`/`routes`/`validate`/`after` hooks, `loom prerender` re-run
- [ ] 3.7 CLI entry (`build` / `dev` / `prerender`, `--mode`, `--outDir`) over the programmatic API; `node --test` suites for the config loader, mode resolution, shell resolution and the prerender pipeline against a fixture app
- [ ] 3.8 Package README (quick start, every option, hooks contract, escape hatch, pre-1.0 note)

## 4. App migration (D7)

- [ ] 4.1 Capture baseline `build/` trees for both apps (file list, shell markup, state scripts) into the scratchpad before cut-over
- [ ] 4.2 Sandbox: `loom.config.ts`, scripts → `loom build` / `loom dev`, delete `project/client/*` build files, drop `esbuild*` / `tsx` devDeps; diff against baseline
- [ ] 4.3 Loom app: `loom.config.ts` with the four prerender hooks (`llms-text.mts` called from `after`), scripts, delete `build.mts` / `dev.mts` / `config.mts` / `template.html.mts` / `prerender.mts`, drop moved devDeps; diff against baseline; existing `project/client/tests` still pass
- [ ] 4.4 `turbo.json` inputs/env unchanged for `build`/`dev`; `vercel.json` untouched; `pnpm dev` end-to-end as today

## 5. Verification & release prep

- [ ] 5.1 Regression pass against `app-asset-delivery`, `app-prerendering`, `app-edge-caching`, `route-asset-preload`, `app-hydration-boot` scenarios on a production build
- [ ] 5.2 `pnpm type-check` across the tree, `pnpm -F @loom-js/core test-ci`, `pnpm -F @loom-js/loom test-ci`, `pnpm format:check`
- [ ] 5.3 Changesets: minor `@loom-js/core`, `0.1.0` for `@loom-js/build` and `@loom-js/esbuild-plugin-html-split`; root README release docs and `.claude/skills/skill-config.md` + `CLAUDE.md` repo-shape updated
- [ ] 5.4 Mark `docs-build-tool-topic` D2 resolved (wrapper shipped) and unblock its task 2.1
