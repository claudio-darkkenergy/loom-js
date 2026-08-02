## Context

Two advisory counts disagreed, and reconciling them turned out to be most of the analysis. GitHub reports 156 open Dependabot alerts on the default branch; `pnpm audit` on `edge-2026` reports 80.

**The gap is branch divergence.** GitHub's dependency graph scans `main`. `main` is 27 commits behind `edge-2026`, with a ~9,900-line `pnpm-lock.yaml` difference and materially older direct dependencies:

|          | `main`    | `edge-2026`                  |
| -------- | --------- | ---------------------------- |
| `vercel` | `^37.8.0` | `^51.2.1` (51.8.0 installed) |
| `turbo`  | `^2.1.3`  | `^2.9.6` (2.9.9 installed)   |

Matching the two sets by GHSA id gives the actionable picture:

|                                              | Advisories | Criticals |
| -------------------------------------------- | ---------: | --------: |
| Unique advisories behind GitHub's 156 alerts |        137 |         5 |
| Already fixed on `edge-2026`                 |     **94** |     **4** |
| **Surviving onto `edge-2026`**               |     **43** |     **1** |

Surviving alerts by severity: 1 critical, 20 high, 23 medium, 5 low. Concentrated in `undici` (11), `tar` (9), `axios` (6), `js-yaml` (4), `vite` (4), `ws` (3), `minimatch` (3), `turbo` (2), `ajv` (2). The surviving critical is `node-tar` (decompression/parse DoS, patched 7.5.19), reached through the `vercel` CLI. **155 of 156 alerts have a published patch; only `ip` has none.**

Two earlier working assumptions were tested and refuted, and are recorded here so they are not re-proposed:

- **"The gap comes from workspace-excluded manifests."** Wrong. 147 of 156 alerts are attributed to `pnpm-lock.yaml`; `apps/docs` and `apps/sandbox` contribute exactly 1 alert each. The excluded manifests explain ~2 alerts, not 73.
- **"Reading alerts needs a new PAT with `admin:repo_hook`."** Wrong. `loom-js` is public, and the alerts endpoint accepts a classic token with `repo`/`public_repo`. The 403 came from the `gh` CLI defaulting to an unrelated account with read-only repo access; `gh auth switch --user claudio-darkkenergy` resolves it with the existing PAT. No new credential is required.

A secondary, smaller effect: GitHub emits one alert per (advisory × manifest), so 137 unique advisories produce 156 alerts — e.g. one `esbuild` advisory appears against 7 manifests.

Constraints: pnpm + turborepo monorepo; `pnpm-workspace.yaml` excludes `apps/docs`, `apps/sandbox`, `packages/ui-kit`. Published packages must keep their dependency surface unchanged — `@loom-js/core` has zero deps and zero peerDeps by design.

## Goals / Non-Goals

**Goals:**

- Get `main` onto the current dependency tree so the alert count describes reality rather than a stale branch.
- Eliminate every critical and high advisory that survives onto `edge-2026` and has an available patch.
- Keep install, build, and test green across every bump — an advisory-count drop is not by itself evidence.
- Leave a written record of any advisory knowingly left open.

**Non-Goals:**

- Deleting `apps/docs` / `apps/sandbox`. They contribute 1 alert each; whether they should exist is a separate question.
- Adding `@loom-js/core` dependencies, or changing any published package's runtime dependency surface.
- Introducing automated dependency updates (Dependabot/Renovate config). Worth doing, but a workflow change, not a remediation.
- Chasing the `ip` advisory, which has no published patch.
- Provisioning new credentials. Established as unnecessary.

## Decisions

### Decision 1: Do not merge `edge-2026` into `main` as part of this change

Merging would clear 94 of 137 advisories and 4 of 5 criticals at no dependency cost, which makes it tempting to frame as step one. It is nonetheless out of scope: pushing to `main` triggers `.github/workflows/publish-packages.yml`, which opens a Version Packages PR and publishes `@loom-js/core`, `tags`, and `pink` from the 3 pending changesets. The merge also carries 27 commits / 196 files / +13,311 lines of feature work (docs TOC, `tags` anchor/Link, utils hooks, a component-prop-type refactor).

Shipping a release is a product decision. Attaching it to a security remediation would smuggle it in under a label that discourages scrutiny — the wrong reason to release, whatever the alert count says.

- **Consequence, accepted:** GitHub's alert count stays ~156 for the duration of this change. That number describes `main`, a branch not developed on; it is not the success metric here.
- **Alternative considered:** Cherry-pick only the lockfile/manifest changes onto `main`. Rejected — `pnpm-lock.yaml` is entangled with `package.json` changes spread across all 27 commits, so the "narrow" version is neither narrow nor low-risk.

### Decision 2: Scope remediation to the 43 surviving advisories, not the 156 headline

The 156 is a property of `main`'s staleness. Targeting it directly would mean re-fixing 94 advisories already fixed on the working branch. The real backlog is 43, and the tasks are sized to that.

### Decision 3: Take `vercel` to 58.x, and treat the dev-flow regression as the real work

Per user direction, and it is where the surviving severity concentrates — `vercel` is the top-level source of the `tar` and `undici` paths, including the one surviving critical. Staying on 51.x leaves them open, since the fixes landed in later majors.

The bump's cost is not the version edit, it is the verification: `vercel dev -p 2000` must still serve `services/api/*.ts`, and the `@vercel/node` handler signature may have shifted across seven majors. Verify by hitting an endpoint, not by watching the process start.

- **Alternative considered:** Drop `vercel` if `services/` is unused. Not chosen — `pnpm dev` and `pnpm api` are the documented dev entry points and `services/api/log.ts` is live.

### Decision 4: Fix by upgrading the top-level dependency, not by pinning transitives

Prefer bumping the direct dependency so its own resolution pulls patched transitives. Use pnpm `overrides` only where a direct bump cannot reach a patched version, and record each with the advisory it addresses and a removal condition — unexplained overrides rot into permanent forks of the dependency tree.

- **Alternative considered:** Blanket `overrides` for `tar`/`undici`/`minimatch`. Rejected as the default — it silently forces versions the parent package never tested against.

### Decision 5: Hold excluded manifests to a lower, explicitly-labelled evidence bar

`apps/docs` and `apps/sandbox` have no lockfile, no install, and no CI. Their bumps are declared-range edits validated only against registry metadata, and SHALL be reported as unverified rather than folded into any green-baseline claim. At 1 alert each, they are a footnote — do not let them consume disproportionate effort.

### Decision 6: Record accepted residue in a tracked file

Any advisory left open needs a written reason (no patch published / fix requires an unacceptable break / not reachable in our usage). Without this, the next person cannot distinguish "triaged and accepted" from "nobody looked" — which is the failure mode this change exists to fix.

## Risks / Trade-offs

- **`main` stays vulnerable while this change runs** → Accepted, and narrow: `main` is not developed on, and the advisories are build tooling that only affects someone who checks it out and installs. The published packages carry none of it. `main` gets the fixes when it is next released.
- **`vercel` 51 → 58 breaks the local API dev flow** → Verify `pnpm api` serves a real request before declaring done; keep it in its own commit so it can be reverted without unpicking the other bumps.
- **`@web/dev-server-esbuild` sits under the test runner** → A bump there can break `test-ci` in ways unrelated to product code. Bump it separately so a failure stays attributable.
- **Lockfile refresh silently changes far more than the advisories** → Review the lockfile diff for unexpected major jumps rather than trusting the count drop.
- **GitHub's alert count will not move at all during this change** → Expected, since it tracks `main` and nothing here lands there. Measure against the local `pnpm audit` baseline on `edge-2026`; treating the GitHub number as the scoreboard would make correct work look like failure.
- **Alert count may not reach zero** → Accepted. The bar is "no critical/high with an available patch", plus a documented reason for everything else — not a vanity zero. `ip` has no patch and will remain.
- **GitHub reports 148 of 156 alerts as `runtime` scope** → Misleading. pnpm lockfiles do not cleanly mark dev-only transitives, and these are overwhelmingly build tooling. Do not use GitHub's scope field to argue shipped-code exposure; verify against the published packages' manifests instead.

## Migration Plan

All steps run on `edge-2026`. `main` is not touched.

1. Capture the baseline: the 43 advisories surviving onto `edge-2026` (1 critical, 20 high, 23 medium, 5 low).
2. Bump in separable commits: (a) `vercel`, (b) test-runner tooling, (c) remaining workspace deps, (d) excluded manifests.
3. Verify after each: install, build-packages, build, `test-ci`; and for (a) an actual request against `pnpm api`.
4. Record residual advisories with rationale.

**Rollback:** each bump group is its own commit; `pnpm-lock.yaml` is regenerable from reverted manifests via `pnpm install --lockfile-only`.

## Open Questions

- Do the `services/api/*.ts` handlers need signature changes for `@vercel/node` under `vercel` 58.x?
- Can all 11 `undici` and 9 `tar` alerts be cleared by the `vercel` bump alone, or is an `override` needed for a straggler?
- Is `lib/open-ai` (and its `openai` dependency) still live, or vestigial alongside `services/`?
- Should Dependabot/Renovate be enabled afterwards so `main` cannot drift this far again? Out of scope here, but this change is the argument for it.
