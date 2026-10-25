# Loom Devtools

## Why

App authors have no way to see a loom app's component tree, the props each instance rendered with, or which activities drive which parts of the page — the only runtime surface is `loom.setDebug` narration. React, Vue, Solid and Angular all ship an inspector; loom's should need no browser extension, and should be switchable on in a production build when a bug only reproduces there.

## What Changes

- `component(fn, { name })` — an optional display name. `@loom-js/build` injects names automatically from the declaring `const` (`const ContentCard = component(…)` → `ContentCard`); an explicit `name` always wins. `defineElement` components fall back to their tag name. `simple()` components stay transparent (they own no context).
- Core gains introspection primitives on a new `@loom-js/core/devtools` subpath: a registry of mounted app roots, a context-tree walk, element → owning-component lookup, activity back-references from effect boundaries and attr bindings, and one nullable devtools hook on the render and activity-creation paths. With the hook unset the added hot-path cost is a null check.
- The existing `loom` console global gains `loom.devtools.enable() / disable() / open('dock' | 'popup')` in every build. While devtools runs, it also carries `loom.tree()`, `loom.inspect(element)` (pair with DevTools' `$0`) and `loom.activities()`, returning plain objects the native console can expand; core builds those records, and the devtools package installs them, so core's main entry ships none of it.
- New package `@loom-js/devtools`: a backend that runs in the page against the app's core instance, and a prebuilt HUD (built with loom + pink) that runs in its own document — docked in an iframe or popped out to a window — talking to the backend over a versioned message protocol. Tree view, props/activities inspector, element picker with highlight, render flashing, live activity editing, "log to console", custom console formatters, and Chrome Performance-panel tracks.
- `loom.config` gains `devtools: 'dev' | 'lazy' | false` (default `'dev'`): `'dev'` wires the lazy devtools loader into development builds, `'lazy'` into production builds too (zero initial bytes — the chunk loads only when switched on), `false` never. Raw-esbuild users call `registerDevtools(() => import('@loom-js/devtools'))` themselves.

## Capabilities

### New Capabilities

- `component-display-names`: the `name` option, the name registry, build-time injection, explicit-wins precedence, and the tag-name fallback for elements.
- `devtools-introspection`: core's root registry, tree walk, element lookup, activity references, the devtools hook and its off-path cost, the loader registration and runtime switch, and the `loom` console API.
- `devtools-protocol`: the message envelope, handshake and versioning, session and id rules, the request/response/event catalog, value encoding, and the postMessage transport's origin checks.
- `devtools-inspector`: the `@loom-js/devtools` backend and HUD — docked and popup placements, reconnect across reloads, picker/highlight, render flashing, activity editing, console formatters and performance tracks.

### Modified Capabilities

- `build-tool-config`: adds the `devtools` config key and the mode-dependent name injection and loader wiring it controls.

## Impact

- `packages/core` — `component.ts` / `define-element.ts` (names), `app.ts` / `hydrate.ts` (root registry), `activity.ts` + `lib/attr-binding.ts` (back-references), render/mount/unmount paths (hook sites), `lib/bootstrap.ts` + `types.ts` (`LoomGlobal`), new `src/devtools.ts` entry + `rollup.config.ts` / `package.json` `exports['./devtools']`. Minor changeset.
- `packages/build` — name-injection esbuild plugin, `devtools` key in `config.ts` / `resolve-config.ts`, loader wiring. Minor changeset.
- `packages/devtools` — new published workspace (`@loom-js/devtools`), peer-depends on `@loom-js/core`; builds its HUD with `@loom-js/pink`. Initial changeset.
- `apps/loom`, `apps/sandbox` — install `@loom-js/devtools` as a dev dependency so the `'dev'` default is live (dogfooding).
- Repo plumbing — `.prettierrc` `packageJSONFiles`, `turbo.json` if the HUD prebuild needs a task, `.claude/skills/skill-config.md`, `CLAUDE.md` repo shape, `SOLID-AUDIT-REPORT.md` module audit.
- Docs — new `devtools` topic (`package: @loom-js/devtools`), `components` (name option), `build-tool` (`devtools` key), `diagnostics` (pointer to the console API); `docs/content-map.md`; push = publish to Contentful.
