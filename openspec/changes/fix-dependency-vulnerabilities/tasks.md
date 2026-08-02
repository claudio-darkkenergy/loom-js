## 1. Alert access — RESOLVED, no new credential needed

- [x] 1.1 ~~Create a PAT with `admin:repo_hook`.~~ Not required. `loom-js` is public, so the Dependabot alerts endpoint accepts the existing PAT's `repo`/`public_repo` scope. The 403 came from the `gh` CLI defaulting to an unrelated account with read-only repo access.
- [x] 1.2 Access verified via `gh auth switch --hostname github.com --user claudio-darkkenergy`; `gh api repos/claudio-darkkenergy/loom-js/dependabot/alerts` returns data.
- [x] 1.3 Full alert list pulled and summarized: 156 open (5 critical, 64 high, 66 medium, 21 low); 137 unique advisories; 147 alerts attributed to `pnpm-lock.yaml`; 155 of 156 have a published patch (only `ip` does not).

## 2. Reconcile the counts — RESOLVED

- [x] 2.1 Baseline captured: `pnpm audit` on `edge-2026` = 80 advisories (2 critical, 29 high, 38 moderate, 11 low).
- [x] 2.2 ~~Hypothesis: the gap comes from workspace-excluded manifests.~~ **Refuted.** `apps/docs` and `apps/sandbox` contribute 1 alert each. The real cause is **branch divergence** — GitHub scans `main`, which is 27 commits and ~9,900 lockfile lines behind `edge-2026` (`vercel ^37.8.0` vs `^51.2.1`; `turbo ^2.1.3` vs `^2.9.6`).
- [x] 2.3 GHSA cross-reference: of 137 unique advisories, **94 are already fixed on `edge-2026`** (including 4 of 5 criticals); **43 survive** (1 critical, 20 high, 23 medium, 5 low).

## 3. Scope note — `main` is explicitly out of scope

- [x] 3.1 **Decided: no merge.** Landing `edge-2026` on `main` would clear 94 advisories for free, but pushing to `main` triggers the release workflow — publishing `@loom-js/core`, `tags`, and `pink` from the 3 pending changesets, and shipping 27 commits / 196 files of feature work. That is a release decision, not a security remediation, and it is not part of this change.
- [x] 3.2 All remediation and all measurement in this change happen on `edge-2026`. The working baseline is the **43 surviving advisories** (1 critical, 20 high, 23 medium, 5 low), not GitHub's 156 — that number describes `main`.
- [x] 3.3 Expect GitHub's alert count to stay ~156 throughout this change. That is not a failed remediation; `main` picks the fixes up whenever it is next released on its own schedule.

## 4. Remediate the surviving advisories — `vercel` (own commit)

- [x] 4.1 Bumped root `vercel` 51.8.0 → 58.4.4; lockfile diff reviewed — mostly removals (vercel 58 dropped its proxy-agent/js-yaml/form-data subtree); no unexpected major jumps. Note: `ip` left the tree entirely, so the one unpatchable advisory is gone.
- [x] 4.2 The bump alone did **not** clear the groups — vercel 58.4.4 still pins vulnerable transitives (`@vercel/fun>tar 7.5.7` incl. the critical, `undici` 5.28.4/6.25.0). Cleared via the 9 targeted overrides in 5.3; `pnpm audit` now reports **zero known vulnerabilities**.
- [x] 4.3 `services` compiles clean (`tsc --noEmit`) against `@vercel/node` 5.9.3 — handler signatures unchanged. Two latent issues fixed: `services/tsconfig.json` needed `ignoreDeprecations` for TS 6's node10-resolution warning, and `edge-response.ts` typed its header map as `HeadersInit` while indexing/spreading it as a plain record (now `Record<string, string>`; the `|| null` origin fallback made explicit as the CORS `'null'` string it was already coerced to).
- [x] 4.4 `pnpm api` served a real request: `GET /api/region-test` → HTTP 200 "Hello from dev1" (edge runtime). `pnpm dev` comes up: API 200 on :2000 and the loom app serving HTML on :9092 simultaneously. (First attempt failed only because a stale dev server from an earlier session held :9092.)

## 5. Remediate the remaining surviving advisories

- [x] 5.1 ~~Bump `@web/dev-server-esbuild` separately.~~ Arrived pre-bumped: the working tree already carried `@web/dev-server-esbuild` 2.0.0, `@web/test-runner` 1.0.0, `@web/test-runner-puppeteer` 1.0.1, `sinon` 22, `puppeteer` 25 mixed with the other bumps. Verified as a unit instead: `pnpm -F @loom-js/core test-ci` green (8 files, 56 passed).
- [x] 5.2 Bump `turbo` 2.9.9 → 2.10.8 and refresh `vite`, `axios`, `js-yaml`, `ws`, `minimatch`, `ajv`, `contentful`, `esbuild`, `tsx` — done via the pre-applied tree bumps; `axios`, `vite`, `ws`, `contentful`, `esbuild`, `tsx` advisories cleared (audit 80 → 50). **Reverted `typescript` 7.0.2 → 6.0.2** (not advisory-driven; `@rollup/plugin-typescript` 12.3.0, the latest, cannot load TS 7 — restore the bump when it can). Fixed `packages/pink/.storybook/main.ts` for storybook 10.5's strict-ESM config loading (`createRequire` instead of bare `require`).
- [x] 5.3 Nine range-scoped overrides added to `pnpm-workspace.yaml`, each annotated with its GHSA ids, the pinning parent, and the shared removal condition (drop once a plain install resolves the parent into the patched range): `tar` →7.5.22, `undici` →6.28 (5.x had no patch for the highs), `minimatch` 10.x →10.2.6, `js-yaml` →4.3.1 (python-analysis calls `yaml.load`, kept in v4), `path-to-regexp` 8.x →8.4.2, `brace-expansion` 1.x →1.1.18, `ajv` 8.x →8.20, `smol-toml` →1.7.1, `@tootallnate/once` →2.0.1. All same-major except `undici` 5→6 and `js-yaml` 3→4, both forced by patch availability and covered by the 4.4 dev-flow verification.
- [x] 5.4 Full green gate after overrides: `pnpm install`, `pnpm build-packages` (3/3), `pnpm build` (6/6), `pnpm -F @loom-js/core test-ci` (56 passed), `type-check` + `type-check-tests` all green.
- [x] 5.5 Confirmed: `@loom-js/core` declares `{}` dependencies and `{}` peerDependencies; `tags`/`pink`/`esbuild-plugin-html-split` runtime dep sets unchanged (only `esbuild ^0.28.0 → ^0.28.1` range patch).

## 6. Excluded manifests (2 alerts total — footnote, not a workstream)

- [x] 6.1 Both alerts are `esbuild` GHSA-67mh-4wv8-2f99 (moderate, patched 0.25.0). `apps/docs` bumped `^0.23.0` → `^0.28.1`. `apps/sandbox` needed no edit — its `^0.28.0` range already excludes the vulnerable `<=0.24.2`; GitHub's alert reflects `main`'s stale manifest.
- [x] 6.2 Registry-validated only: esbuild 0.28.1 is published and outside the vulnerable range (the same version resolves in the installed workspace). No build run against either app.
- [x] 6.3 Labelled unverified in the commit message; excluded from the green-baseline claim.

## 7. Record and close out

- [x] 7.1 `ACCEPTED-ADVISORIES.md` created at the repo root. It currently records **zero** accepted advisories — `ip` no longer belongs there because it left the dependency tree entirely with the `vercel` 58 bump — plus the maintenance rules and a pointer to the overrides in `pnpm-workspace.yaml`.
- [x] 7.2 Final `pnpm audit` on `edge-2026`: **0 known vulnerabilities** (full and `--prod`), from a baseline of 80 reported / 43 surviving unique advisories (1 critical, 20 high, 23 medium, 5 low). Progression: 80 → 50 (tooling refresh) → 47 (vercel 58) → 0 (overrides). GitHub's ~156 count tracks `main` and is unchanged by design.
- [x] 7.3 Confirmed: shipped-code exposure was argued from manifests only — `@loom-js/core` declares `{}` deps/`{}` peers, `tags` depends on `core` only, and no published package's runtime dep set changed. GitHub's `scope: runtime` field was never cited.
- [x] 7.4 One changeset added (`esbuild-plugin-html-split` patch) because its published `dependencies` range changed (`esbuild ^0.28.0 → ^0.28.1`). All other changes are devDependencies — no changesets for those.
- [x] 7.5 `SOLID-AUDIT-REPORT.md` checked: the only 🔴 Critical is `services/api/log.ts`, which this change did not touch; no open violations in the files modified. `.claude/skills/skill-config.md` updated: test-runner/sinon versions, and a new "Dependency security conventions" note (annotated overrides, `ACCEPTED-ADVISORIES.md`, TS 6 pin rationale).
