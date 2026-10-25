# Tasks

## 1. Core — display names

- [x] 1.1 Check `SOLID-AUDIT-REPORT.md` for open violations in `component.ts`, `define-element.ts`, `activity.ts`, `app.ts`, `hydrate.ts`, `lib/bootstrap.ts`, `lib/attr-binding.ts`, `lib/context/life-cycles.ts`; resolve any 🔴 first and verify the report entries read ✅
- [x] 1.2 Add the name registry (template function → name) and `component(fn, { name })` (`ComponentFactory` gains the optional options arg); verify with a new `tests/unit/component-display-names.spec.ts` (explicit name, no-arg unchanged, identical DOM with/without name) and `pnpm -F @loom-js/core type-check type-check-tests`
- [x] 1.3 Add the injection setter (no-op when an explicit name exists) and the `defineElement` `Name <tag>` / `<tag>` / `Anonymous` resolution; extend the spec with explicit-wins and element cases; `pnpm -F @loom-js/core test-ci`
- [x] 1.4 Document the `name` option in `docs/topics/04-components.md`; verify the example compiles by pasting it into `apps/sandbox` and running `pnpm -F @loom-js/sandbox type-check`

## 2. Core — introspection primitives

- [x] 2.1 Root registry: `init` / `hydrate` record their root context; removed roots drop out; verify in `tests/unit/devtools-introspection.spec.ts` (late enable sees the full current tree)
- [x] 2.2 Tree walk over live contexts (components + effect boundaries, render order, keys, unmounted excluded); spec covers keyed lists and a replaced subtree
- [x] 2.3 Element → owning instance lookup by walk; spec covers nested lookup and an outside-app node
- [x] 2.4 Activity back-refs on effect-boundary contexts and on `AttrBinding`; walk reports per-instance activities with diagnostic identity, value, pending; spec covers a `bind()`-only activity
- [x] 2.5 Nullable devtools hook with sites for rendered (with timing only when set), mounted, unmounted, activity created/committed; spec asserts each callback fires with the hook set and that nothing is timed with it unset
- [x] 2.6 New `src/devtools.ts` entry exporting the primitives, `registerDevtools`, the hook setter and the name setter; add it to `rollup.config.ts` inputs and dts, and `package.json` `exports['./devtools']`; verify `pnpm -F @loom-js/core build-package` emits `dist/devtools.{mjs,js,d.ts}` sharing chunks with `index`
- [x] 2.7 File-audit `SOLID-AUDIT-REPORT.md` for every added core module (fresh entries, headings updated) and state in the report which spec covers each module

## 3. Core — runtime switch and console API

- [x] 3.1 Console-API records `tree()`, `inspect(node)`, `activities()` returning plain objects, exported from `@loom-js/core/devtools` (`LoomGlobal` types them as optional); the devtools backend installs them on the `loom` global while it runs; verify in `tests/unit/loom-console-api.spec.ts` and `backend.spec.ts`
- [x] 3.2 `loom.devtools.enable({ persist }) / disable() / open(placement)`: warn-once with remedy when unregistered, loader call when registered, sessionStorage persist read in `bootstrap` (try/catch) before mount; spec covers unregistered warning, enable/disable, persisted start
- [x] 3.3 Measure: core min+gzip delta of `index` stays ≤ 1 KB (record numbers in the PR notes); `pnpm bench` loom results within noise of the pre-change baseline — measured: +620 B gz (esbuild minify, 18,202 → 18,822) once the console API moved behind devtools (+1,229 B with it in core); bench ops/startup within noise, createRows +2%, heap +10 KB; lazy-loading the console API from core measured a net loss (sandbox initial JS 19,213 → 19,955 B gz), not taken
- [x] 3.4 Write `docs/topics/13-diagnostics.md` pointer to the console API; add a minor `@loom-js/core` changeset

## 4. Build tool — names and the devtools key

- [x] 4.1 Name-injection esbuild plugin (column-0 `const|let X = component|defineElement(` shapes, module-tail setter calls + one import); node test over fixtures in `packages/build/tests` covering exported, typed, generic, nested-skipped and explicit-name modules; `pnpm -F @loom-js/build test-ci`
- [x] 4.2 `devtools: 'dev' | 'lazy' | false` in `config.ts` / `resolve-config.ts`; entry injection of `registerDevtools(() => import('@loom-js/devtools'))` and name injection per mode; default-without-package skips, explicit-without-package fails naming it; node tests for each mode and both missing-package paths
- [x] 4.3 Verify a production fixture build with default `devtools` contains no devtools code or injected names (grep the output), and with `'lazy'` emits the backend only as a separate chunk
- [x] 4.4 Document the key in `docs/topics/15-build-tool.md`; add a minor `@loom-js/build` changeset

## 5. `@loom-js/devtools` — scaffold

- [x] 5.1 Create `packages/devtools` (`package.json` with peer `@loom-js/core`, dev `@loom-js/pink`, `tsconfig` extending `lib/typescript-config`, `build-package`, `type-check`, `test-ci` on `@web/test-runner`); add its manifest to `.prettierrc` `packageJSONFiles`; verify `pnpm install` and `pnpm -F @loom-js/devtools type-check`
- [x] 5.2 Frontend prebuild: bundle the HUD entry (own core + pink CSS) into one self-contained string module consumed by the backend; wire into `build-package` (and `turbo.json` if a separate task is needed); verify `dist/` contains the backend with the frontend string embedded

## 6. `@loom-js/devtools` — protocol

- [x] 6.1 Envelope types, error codes, postMessage transport with origin/source/tag checks; tests: foreign message ignored, cross-origin ignored, request/response correlation
- [x] 6.2 Value encoder (all `Encoded` variants, depth 2, 100-entry cap, path expansion, cycles, unserializable); tests per variant plus cyclic props and a 5,000-item array
- [x] 6.3 Session/handshake/goodbye/retry, id assignment (stable, never reused, `unknown-id`); tests: version mismatch, pre-hello rejection, reconnect after a simulated reload

## 7. `@loom-js/devtools` — backend

- [x] 7.1 Request handlers (`tree.get`, `node.inspect`, `activity.*`, `reveal`, `log` with `$loom`) over core's primitives; tests drive each against a mounted fixture app
- [x] 7.2 Subscriptions: install/remove the core hook by topic, rAF batching and per-id coalescing of `tree.changed`, `renders`, `activity.changed`; test: 50 updates in a frame → one event, no topics → hook unset
- [x] 7.3 Page layer (closed shadow root outside app roots): hover/selection outlines, picker that swallows the selecting click, render flashes; tests: pick selects the owner and the app handler does not fire
- [x] 7.4 Console formatters for console-API results and logged loom objects; test the formatter header/body output directly
- [x] 7.5 Performance tracks via `performance.measure` with devtools track detail for renders and commits, gated by the `perf` topic; test the measure calls' names, track and timings

## 8. `@loom-js/devtools` — HUD

- [x] 8.1 HUD shell (loom + pink): dock iframe via `srcdoc`, popup via `window.open` + `document.write`, pop-out control, blocked-popup fallback with console hint; verify in the sandbox app
- [x] 8.2 Tree pane (names, keys, effect boundaries, live updates, stable selection, hover highlight); inspector pane (read-only expandable props, activities, life-cycle state, log button)
- [x] 8.3 Activities pane (list, JSON edit, reset, read-only non-editable), render-highlight toggle with per-instance counts, perf toggle
- [x] 8.4 Isolation checks: tree read with the dock open has no HUD nodes; global app `button` style leaves HUD unaffected and vice versa
- [x] 8.5 Package README (install, `devtools` key, raw-esbuild `registerDevtools`, CSP limitation); initial changeset for `@loom-js/devtools`

## 9. Apps, docs and repo plumbing

- [x] 9.1 Add `@loom-js/devtools` as a dev dependency of `apps/loom` and `apps/sandbox`; verify `pnpm dev` → `loom.devtools.enable(); loom.devtools.open('dock')` shows each app's tree with injected names (pink components included)
- [x] 9.2 New `docs/topics/NN-devtools.md` (`package: @loom-js/devtools`): enabling, console API with `$0`, dock/popup, picker, activity editing, formatters, perf tracks, `devtools` key, prod `'lazy'`; add it to `docs/content-map.md`; verify `pnpm -F @loom-js/core build-package` leaves it out of core's `llms-full.txt`
- [x] 9.3 Push the new and edited topics to Contentful and publish them; verify on the deployed docs site after the next build — published 2026-10-24
- [x] 9.4 Update `CLAUDE.md` repo shape (new package), `.claude/skills/skill-config.md` (new workspace, `./devtools` subpath), and run `pnpm format:check`

## 10. Integration

- [x] 10.1 End-to-end in `apps/loom` production build with `devtools: 'lazy'` (`--outDir` isolated): initial bundles unchanged in size, `loom.devtools.enable()` loads the chunk, dock + popup + picker + activity edit + reload-reconnect all work
- [x] 10.2 Full gate: `pnpm build-packages`, every workspace's `type-check`, `pnpm -F @loom-js/core test-ci`, `pnpm -F @loom-js/build test-ci`, `pnpm -F @loom-js/devtools test-ci`, `pnpm bench`
