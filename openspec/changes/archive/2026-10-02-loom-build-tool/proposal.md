# Loom Build Tool

## Why

The blessed way to build a loom app — tsx-driven esbuild, `esbuild-plugin-html-split` shells with route-scoped dynamic chunks, and the SSG prerender phase — exists only as ~450 lines of per-app wiring under `apps/loom/project/client/` (a stripped copy under `apps/sandbox`), riding a plugin that is `private: true`. Nothing outside this repo can use it, and `docs-build-tool-topic` can't document it without describing an uninstallable setup. Loom should own its build story the way Next.js owns turbopack: one official package, a vite-shaped option surface, the plugin public underneath.

## What Changes

- **New package `@loom-js/build`** — the official loom build tool. A `loom` CLI (`loom build`, `loom dev`) reads `loom.config.ts` (`defineConfig`) and runs the esbuild assembly, HTML shell generation, static copy, and the prerender phase. Apps stop owning `build.mts` / `dev.mts` / `config.mts` / `template.html.mts`.
- **`esbuild-plugin-html-split` goes public** — renamed to `@loom-js/esbuild-plugin-html-split`, published to npm with a compiled `dist/`, a README, and a changeset. `@loom-js/build` depends on it; raw-esbuild users can still use it directly.
- **Prerender becomes generic** — the app-specific SSG runner (`apps/loom/project/client/prerender.mts`) splits into the reusable pipeline (shell preservation, per-route render against a fresh `linkedom` window, boot-slot injection, output validation) owned by `@loom-js/build`, and app hooks declared in config: route enumeration, a prerender entry module, and post-render steps (loom's llms-text emission stays an app hook).
- **Shell boot contract moves into core's server surface** — the app-root / state-script slot ids and `injectPrerender` (`apps/loom/src/app/boot-contract.ts`) are consumed by both the shell template and the client boot, so `@loom-js/core` exports them and the app imports them from there.
- **Default shell template** — `@loom-js/build` ships the current route-scoped template as the default; `template` stays an override hook.
- **`apps/loom` and `apps/sandbox` migrate** to `loom.config.ts` + the CLI; the per-app `project/client/` build files are deleted. Build output, Vercel serving, turbo tasks and env injection are unchanged.
- **BREAKING** (workspace-only — the plugin had no external consumers): `esbuild-plugin-html-split` is renamed under the `@loom-js` scope.

## Capabilities

### New Capabilities

- `build-tool-config`: `@loom-js/build`'s public contract — `defineConfig` option surface, the `loom build` / `loom dev` commands, env and output conventions, the raw-esbuild escape hatch.
- `build-tool-prerender`: the generic SSG phase — how routes are enumerated, rendered, validated and injected into shells through app-declared hooks.
- `html-split-plugin-publishing`: the plugin is a published `@loom-js` package with a compiled entry, typed options, and a README that stands on its own.

### Modified Capabilities

- `app-prerendering`: the loom app's prerender requirements are satisfied by `@loom-js/build`'s prerender phase plus app hooks, not an app-owned runner; the "discovered from the content source" requirement becomes an enumeration hook.
- `sandbox-baseline-health`: "the sandbox builds and serves" runs through the `loom` CLI.
- `dehydrated-state`: the shell boot contract (slot ids, slot markup, `injectPrerender`) is a core export shared by shells, injectors and the client boot.

## Impact

- New workspace `packages/build` (`@loom-js/build`); `packages/esbuild/esbuild-plugin-html-split` becomes a published package (`private` dropped, `build-package` script, `dist/` output, `publishConfig` already public).
- `apps/loom`, `apps/sandbox`: `project/client/` build files removed; `package.json` scripts become `loom build` / `loom dev`; `loom.config.ts` added; `esbuild`, `esbuild-plugin-clean`, `esbuild-plugin-copy`, `linkedom`, `tsx` devDeps move to `@loom-js/build`.
- `packages/core`: `src/server.ts` exports the boot contract.
- `.prettierrc` `packageJSONFiles`, `pnpm-workspace.yaml`, `turbo.json` (`build-package` for the two new publishables), `.claude/skills/skill-config.md`, root `README.md` release docs.
- Changesets: minor `@loom-js/core`, first release `@loom-js/build` (0.1.0) and `@loom-js/esbuild-plugin-html-split` (0.1.0).
- `docs-build-tool-topic` re-sequences after this change and documents `@loom-js/build`'s config (D2 resolved: wrapper).
