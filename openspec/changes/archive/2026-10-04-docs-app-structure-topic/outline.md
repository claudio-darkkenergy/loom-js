# Outline — `app-structure` topic

Slug `app-structure`, title **App Structure**. Placement: `/docs` listing, "Reference" group (`zeCgs0CoOud8r4tOF6l3f`), between `diagnostics` and `build-tool` — where the files go, then how they compile, then `feedback` last. Source file `docs/topics/16-app-structure.md`; content-map entry 15. Source of truth: `apps/loom` (pointers per section below); `packages/build/tests/fixtures/app` is the minimal form of the same shape and `apps/sandbox` the client-only form.

**Standalone, not paired** (design's open question): `build-tool` is published and complete on its own; this topic links to it wherever a file's home is a config field, and repeats none of the option reference.

**Lead.** A loom app is three kinds of module: the component tree, the browser entry that boots it, and the server modules that render it ahead of time. This topic covers what goes in each, which may import which, and where the rest of a project's files live.

## The three module roles

- One table: role · file · runs in · may touch the DOM at module scope.
    - **App module** `src/app/app.ts` — exports the `App()` factory; browser and server; no.
    - **Browser entry** `src/app/bootstrap.ts` — primes state, calls `hydrate`; browser only; yes.
    - **Server module** `src/app/prerender.entry.ts` — exports `prerenderRoute`; build or server only; never loaded by a shell.
- Minimal three-file example (the fixture's `app.ts` / `bootstrap.ts` / `prerender.entry.ts`, trimmed).
- Cross-links: [Bootstrapping](/docs/bootstrapping), [Client Hydration](/docs/hydration), [Server Rendering](/docs/server-rendering).
- _Source:_ `apps/loom/src/app/app.ts`, `bootstrap.ts`, `prerender.entry.ts`; `packages/build/tests/fixtures/app/src/*`.

## Import direction

- The rule: both entries import the App module; the App module imports neither; the entries never import each other.
- Arrow diagram (code block): `bootstrap.ts → app.ts ← prerender.entry.ts`, with `app.ts → pages / components / logic` below.
- Why: importing the browser entry off-browser runs its boot code with no `document`; importing the server module in the browser ships `@loom-js/core/server` and build-only code to users.
- Everything `app.ts` reaches (pages, components, activities, providers) inherits the App module's rules.
- _Source:_ the import blocks of the three files above.

## Scope rules

- Module scope in shared modules: no `document` / `window` access; a guarded read (`typeof window === 'undefined'`) is the exception, shown with `app.ts`'s `__ROUTE_ASSETS__` read.
- Window-dependent composition goes inside the returned function, not at factory-call time — `App()` returns `(ctx) => …` because `renderToString` installs the window only once the render runs.
- Browser-only side effects (live reload, analytics beacons, global CSS imports) belong in the browser entry.
- Life-cycle hooks and event handlers are browser-time; cross-link [Server Rendering](/docs/server-rendering) "Semantics worth knowing" instead of restating.
- _Source:_ `apps/loom/src/app/app.ts` (manifest guard, deferred composition), `bootstrap.ts` (`__DEV__` blocks, side-effect imports).

## Pages and routes

- Route pages are modules with a default export, loaded by `createRoutes` importers; one directory per route under `pages/`.
- Name page directories after the route path (`pages/docs/` for `/docs`, `pages/` for `/`) so the build's route chunks and per-route CSS line up — one sentence, then link [Build Tool › Routes and shells](/docs/build-tool).
- Page-private components live under the page (`pages/docs/components/`); shared ones under `components/`.
- _Source:_ `apps/loom/src/app/app.ts` (`createRoutes` config), `src/app/pages/`.

## Components and logic

- `components/<group>/<name>/` — `Name.ts`, optional `Name.module.css`, `index.ts` re-export.
- `logic/activity/` (module-level activities), `logic/hooks/` (composition helpers), `logic/providers/` (data fetching; the transport is swappable so the server module can point it elsewhere).
- Stated as the reference app's convention with the reason for each split, not as a requirement.
- _Source:_ `apps/loom/src/app/components/`, `src/app/logic/`.

## The shell and static files

- The shell is generated, not authored: no `index.html` in the source tree. `html` in `loom.config.ts` layers title, head and body class; the root element and state script come from core's boot contract. Link [Build Tool › HTML](/docs/build-tool).
- `public/static/` → copied to `<outDir>/static` (`publicDir`); `public/styles/` → global stylesheets named in `styles`; `src/assets/` → files imported from code (fonts), bundled and hashed.
- CSS modules sit beside their component; global CSS imported for side effects goes in the browser entry.
- _Source:_ `apps/loom/loom.config.ts` (`html`, `publicDir`, `styles`), `apps/loom/public/`, `src/assets/`, `packages/build/src/template.ts`.

## Aliases and config homes

- An alias for the source root is recommended, not required; its spelling is the team's. Declared once in `tsconfig.json` `paths`; the build tool reads it from there. The reference app uses `@/*` → `./src/*`; `@app/…` in the docs' examples stands for your app-level alias. Relative imports inside a feature directory, the alias across them.
- Table of config homes: `loom.config.ts` (entry, routes, shell, prerender hooks) · `tsconfig.json` (aliases, type-check scope including `loom.config.ts`) · `package.json` (`loom build` / `loom dev`) · `src/app/types/declarations.d.ts` (define globals, CSS-module and asset typings) · host config (`vercel.json`: rewrites to the route shells and `shell.html`).
- _Source:_ `apps/loom/tsconfig.json`, `package.json`, `src/app/types/declarations.d.ts`, `vercel.json`; `packages/build/src/load-config.ts`.

## Build-time code

- Code that runs only in the build (prerender hooks' helpers, text generators) lives outside `src/` — `project/` in the reference app — and is imported by `loom.config.ts`, never by the App module.
- The server module is the one build-time file inside `src/`, because it must share the client bundle (matching css-module names, one core instance). Link [Build Tool › Prerendering](/docs/build-tool).
- _Source:_ `apps/loom/project/client/llms-text.mts`, `loom.config.ts` (`prerender`), `src/app/prerender.entry.ts` header comment.

## The full tree

- Annotated tree of the reference app, directories only below `components/` and `logic/`, one comment per line.
- Closing line: a client-only app is the same tree without the server module and the `prerender` config section.
- _Source:_ `git ls-files apps/loom` (the drift check diffs this tree against it); `apps/sandbox` for the client-only line.

---

## Pointer added elsewhere

`server-rendering` — the browser-entry example is renamed `client.ts` → `bootstrap.ts`, and one sentence follows it: "[App Structure](/docs/app-structure) covers where these modules live and which may import which." Its examples stay.

## Decisions for review

1. **Alias spelling — resolved 2026-10-03.** The alias is the team's choice. The topic recommends having one, shows `apps/loom`'s (`@/*` → `./src/*`) in the tree and the config-homes table, and says in one line that `@app/…` in the docs' examples stands for "your app-level alias". No realignment of the reference app; `apps/sandbox` is not a source for this.
2. **Entry file name — resolved 2026-10-03.** `bootstrap.ts`. The Server Rendering example's `client.ts` is renamed in the same push.
3. **Reference-app warts found** (each its own change, none blocks the topic): directories named with a file extension (`components/content/topic-content.ts/`, `topics/home/components/syntax-container.ts/`); `src/app/topics/` holds only home-page components and overlaps `pages/`; `loom.config.ts` copies `./mocks/**/*` but no `mocks/` directory exists. The tree in the topic omits these.

Drift obligation (spec `docs-app-structure-coverage`): a change to the reference app's entry, module roles, alias or shell conventions updates this topic in the same change. `docs/content-map.md` gets the `app-structure` entry with the pointers above at authoring time.
