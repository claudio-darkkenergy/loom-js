## ADDED Requirements

### Requirement: Measurement is a cached turbo task

`@loom-js/bench#bench` SHALL be a turbo task with `outputs: ["results/**"]`, `dependsOn: ["^build-package"]`, default inputs and no declared `env`, so its hash covers the bench sources, the bench manifest and lockfile subgraph, and `@loom-js/core`'s build output.

#### Scenario: Unchanged inputs restore

- **WHEN** `turbo run bench` runs twice with no change to the bench workspace, its dependencies or core
- **THEN** the second run is a cache hit that restores `results/latest.json` without launching a browser

#### Scenario: Framework version bump misses

- **WHEN** a framework dependency version changes in `apps/bench/package.json` and the lockfile
- **THEN** the next `turbo run bench` is a cache miss and remeasures

#### Scenario: Core change misses

- **WHEN** a file under `packages/core/src` changes
- **THEN** the next `turbo run bench` is a cache miss and remeasures

#### Scenario: Content publish hits

- **WHEN** only Contentful content changed and a loom build runs
- **THEN** the bench task is a cache hit and the build spends no time measuring

### Requirement: The loom build depends on the bench task

`@loom-js/loom#build` SHALL list `@loom-js/bench#bench` in `dependsOn`, so `results/latest.json` exists (fresh or restored) before the loom build copies it.

#### Scenario: Build order

- **WHEN** `turbo build --filter=@loom-js/loom` runs on a clean cache
- **THEN** the bench task completes before the loom build starts

### Requirement: Framework versions are bumped by a script into a commit

A root `bench:update` script SHALL update the competitor frameworks and their esbuild compiler plugins in `apps/bench` to their latest published versions, writing the manifest and lockfile, and print the before/after versions. No build step SHALL resolve or install framework versions at build time.

#### Scenario: Update produces a diff

- **WHEN** `pnpm bench:update` runs and a newer react is published
- **THEN** `apps/bench/package.json` and `pnpm-lock.yaml` change and the output names the old and new version

#### Scenario: Frozen install at build

- **WHEN** a Vercel build installs dependencies
- **THEN** the install is frozen-lockfile and the bench measures exactly the versions the lockfile pins
