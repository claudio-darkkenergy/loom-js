## MODIFIED Requirements

### Requirement: The dev server serves with SPA fallback

`loom dev` SHALL watch sources, rebuild on change, and serve `outDir` on `server.port` (default `3000`) with the root shell as the unknown-path fallback. When `prerender` is configured it SHALL also serve every file the `artifacts` hook generates (see `build-tool-prerender`), regenerate them after each successful rebuild and when the user types `r` and Enter, and with `--prerender` serve rendered routes as well. A hook failure SHALL never stop the server.

#### Scenario: Deep link in dev

- **WHEN** the dev server is running and `/docs/anything` is requested
- **THEN** the root shell is served and the app routes client-side

#### Scenario: No prerender section

- **WHEN** `loom dev` runs with a config that has no `prerender` section
- **THEN** the server behaves as before, and `r` and `--prerender` print a note that there is nothing to run

#### Scenario: Prerender flag

- **WHEN** `loom dev --prerender` runs and `/docs/a` is a prerendered route
- **THEN** `/docs/a` is served with rendered markup and its state script, and an unknown path still gets the pristine root shell
