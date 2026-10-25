# build-tool-config Specification

## Purpose

TBD - created by archiving change loom-build-tool. Update Purpose after archive.

## Requirements

### Requirement: A loom app builds from a declarative config and the `loom` CLI

`@loom-js/build` SHALL expose a `loom` CLI with `build`, `dev` and `prerender` commands that load `loom.config.{ts,mts,js,mjs}` from the working directory, and a `defineConfig` export accepting either a config object or a `({ mode }) => config` function. The config SHALL be bundler-neutral: entry, styles, routes, defines, static copies, HTML, dev server and prerender hooks are declared without esbuild option names.

#### Scenario: Minimal app builds with no scripts

- **WHEN** an app declares `entry`, `routes` and `styles` in `loom.config.ts` and runs `loom build`
- **THEN** `build/` contains the client bundle under `static/js/`, the entry stylesheet under `static/styles/`, and one HTML shell per configured route

#### Scenario: Mode-aware config

- **WHEN** `defineConfig` is given a function and `loom dev` runs
- **THEN** the function receives `{ mode: 'development' }`; `loom build` passes `'production'` unless `--mode development` or `NODE_ENV=development` is set

#### Scenario: TypeScript config loads without a loader

- **WHEN** the config file is `loom.config.ts` importing workspace packages
- **THEN** the CLI loads it with no `tsx`/`ts-node` dependency in the app and workspace imports resolve

### Requirement: Mode drives the production/development split

The tool SHALL derive minification, sourcemaps, log level, two-pass CSS mangling, route-scoped shells and the `__DEV__` define from the mode, so an app never sets them.

#### Scenario: Production build

- **WHEN** `loom build` runs in production mode
- **THEN** output is minified with no sourcemaps, each route's shell references only its own route chunks plus shared resources, and `__DEV__` is `false`

#### Scenario: Development build

- **WHEN** `loom dev` runs
- **THEN** output is unminified with sourcemaps, the single fallback shell references every route's chunks, and `__DEV__` is `true`

### Requirement: Output directory is cleaned and overridable

The tool SHALL emit to `build/` by default, wipe it before each production build, and accept `--outDir <path>` or `LOOM_BUILD_DIR` to isolate a build anywhere, including outside the working directory.

#### Scenario: Isolated build

- **WHEN** `LOOM_BUILD_DIR=/tmp/x loom build` runs while a dev server rebuilds `./build`
- **THEN** the build emits to `/tmp/x` and `./build` is untouched

### Requirement: The dev server serves with SPA fallback

`loom dev` SHALL watch sources, rebuild on change, and serve `outDir` on `server.port` (default `3000`) with the root shell as the unknown-path fallback.

#### Scenario: Deep link in dev

- **WHEN** the dev server is running and `/docs/anything` is requested
- **THEN** the root shell is served and the app routes client-side

### Requirement: Raw bundler access is an explicit escape hatch

The config SHALL accept an `esbuild(options)` function applied after every tool default, and the package SHALL export `build`, `dev` and `prerender` for scripted use.

#### Scenario: Escape hatch applied last

- **WHEN** `esbuild: (options) => ({ ...options, keepNames: false })` is declared
- **THEN** the final esbuild invocation carries `keepNames: false` with every other tool default intact

### Requirement: The devtools key controls devtools availability per mode

The config SHALL accept `devtools: 'dev' | 'lazy' | false`, defaulting to `'dev'`. `'dev'` SHALL make devtools available in development builds only, `'lazy'` in development and production builds, `false` in none. Where available, devtools code SHALL load only when switched on, adding nothing to any route's initial bundle.

#### Scenario: Default in production

- **WHEN** an app without a `devtools` key is built in production mode
- **THEN** `loom.devtools.enable()` warns that devtools is not registered, and no devtools code is in the output

#### Scenario: Lazy in production

- **WHEN** an app with `devtools: 'lazy'` is built in production mode
- **THEN** initial route bundles carry no devtools code, and `loom.devtools.enable()` loads it on demand

### Requirement: Name injection follows devtools availability

The build SHALL inject component display names exactly when devtools is available for the build's mode and `@loom-js/devtools` is installed.

#### Scenario: Production without lazy

- **WHEN** an app with the default `devtools` is built in production mode
- **THEN** no component names are injected into the output

### Requirement: A missing devtools package is handled by intent

With `devtools` left at its default and `@loom-js/devtools` not installed, the build SHALL proceed without devtools. With `devtools` explicitly set to `'dev'` or `'lazy'` and the package not installed, the build SHALL fail with a message naming the missing dependency.

#### Scenario: Default without the package

- **WHEN** an app that never installed `@loom-js/devtools` is built in development
- **THEN** the build succeeds, no component names are injected, and `loom.devtools.enable()` warns with the registration remedy

#### Scenario: Explicit without the package

- **WHEN** an app sets `devtools: 'lazy'` without installing `@loom-js/devtools`
- **THEN** the build fails naming `@loom-js/devtools`
