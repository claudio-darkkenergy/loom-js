## Why

GitHub reports 156 open Dependabot alerts (5 critical, 64 high, 66 medium, 21 low) on the default branch. A local `pnpm audit` on `edge-2026` reports 80. That gap is not noise — **GitHub scans `main`, which is 27 commits and roughly 9,900 lockfile lines behind `edge-2026`.** `main` still pins `vercel ^37.8.0` and `turbo ^2.1.3`; `edge-2026` already carries `vercel ^51.2.1` and `turbo ^2.9.6`.

Cross-referencing the two sets by GHSA id: of the **137 unique advisories** behind those 156 alerts, **94 are already fixed on `edge-2026`** — including **4 of the 5 criticals** (`fast-xml-parser`, `basic-ftp`, `form-data`, `koa`). Only **43 survive** onto `edge-2026`: 1 critical, 20 high, 23 medium, 5 low.

So the genuine remediation surface is far smaller than the headline suggests, and it lives on `edge-2026` — the branch actually developed on. The exposure remains build/dev tooling only; the published packages are clean (`@loom-js/core` has zero dependencies, `@loom-js/tags` depends only on `core`). What makes this worth doing is that a permanently-red count trains everyone to ignore the alert list, so a future alert that *does* reach shipped code gets missed.

**`main` is out of scope.** Merging `edge-2026` into it would clear those 94 advisories for free, but pushing to `main` triggers the release workflow — publishing `@loom-js/core`, `tags`, and `pink` from 3 pending changesets and shipping 27 commits of feature work. That is a release decision, not a security remediation. `main` picks these fixes up on its own schedule.

## What Changes

- **Remediate the 43 advisories that survive onto `edge-2026`**, concentrated in `undici` (11), `tar` (9), `axios` (6), `js-yaml` (4), `vite` (4), `ws` (3), `minimatch` (3):
  - **The one surviving critical** is `node-tar` (decompression/parse DoS, patched in 7.5.19), reached through the `vercel` CLI.
  - **BREAKING (dev flow only)** `vercel` 51.8.0 → 58.x, the top-level source of the `tar` and `undici` paths. Seven majors of drift means `vercel dev` and the `services/api/*` handlers must be re-verified.
  - `turbo` 2.9.9 → 2.10.7, plus lockfile-refresh bumps for `vite`, `contentful`, `esbuild`, `tsx`, and `@web/dev-server-esbuild`, several already satisfiable inside their declared ranges.
- **Fix the two excluded-manifest alerts.** `apps/docs` and `apps/sandbox` account for exactly 1 alert each — a rounding error, not the driver. Bump their ranges, but treat them as best-effort: they have no lockfile, no install, and no CI, so nothing about them is verifiable by build or test.
- **Record the residue.** 155 of 156 alerts have a published patch; only `ip` has none. Anything left open gets a written reason so a non-zero count stays meaningful.

## Capabilities

### New Capabilities

- `dependency-security-hygiene`: Defines the project's obligations around dependency advisories — that the installed workspace carries no known critical or high advisory with an available patch, that alert counts are read against the branch they actually describe, that published-package dependency surface stays minimal, and that any knowingly-accepted advisory is documented with a reason rather than left unexplained.

### Modified Capabilities

<!-- None. No existing capability's requirements change; `core-baseline-health` covers type-check/test/lint health, not dependency advisories. -->

## Impact

- **Branch:** all work and all measurement happen on `edge-2026`. `main` is untouched, so GitHub's alert count will stay ~156 for the duration — success is measured against the 43-advisory local baseline, not the GitHub number.
- **Manifests:** root `package.json` (`vercel`, `turbo`), `packages/*/package.json`, `apps/loom/package.json`, plus `apps/docs` and `apps/sandbox` (1 alert each). `pnpm-lock.yaml` is regenerated.
- **Dev flow:** `pnpm api` (`vercel dev -p 2000`) and `pnpm dev` are the primary regression risk from the `vercel` major bump. `services/api/*.ts` handlers use the Vercel Node runtime signature and may need adjusting.
- **Build/test:** `pnpm build`, `pnpm build-packages`, and `pnpm -F @loom-js/core test-ci` must stay green; `@web/dev-server-esbuild` sits under the test runner, so a bump there directly affects the suite.
- **Credentials:** none needed. Reading alerts works today via `gh auth switch --user claudio-darkkenergy` with the existing PAT — `loom-js` is public, so the endpoint accepts `repo`/`public_repo` and does not require `admin:repo_hook`.
- **Not affected:** the published packages' runtime dependency surface. No advisory in scope reaches `@loom-js/core` (zero deps) or `@loom-js/tags` (`core` only). `@loom-js/pink` carries real runtime deps; its 4 alerts are `esbuild`/dev-tooling, not shipped code.
- **Release:** no changeset unless a published package's manifest changes; dev-tooling bumps are not user-visible.
