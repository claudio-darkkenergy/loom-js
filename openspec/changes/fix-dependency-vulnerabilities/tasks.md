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

- [ ] 4.1 Bump root `vercel` 51.8.0 → 57.x; `pnpm install`; review the lockfile diff for unexpected major jumps beyond the advisory fixes.
- [ ] 4.2 Confirm the surviving critical (`node-tar` ≤ 7.5.18, patched 7.5.19) is cleared, along with the `undici` (11) and `tar` (9) alert groups.
- [ ] 4.3 Verify `services/api/*.ts` compile against the `@vercel/node` types shipped with 57.x; adjust handler signatures if they changed.
- [ ] 4.4 Start `pnpm api` and **issue a real request** against a `services/api/*` endpoint — a started process is not sufficient evidence. Then confirm `pnpm dev` comes up.

## 5. Remediate the remaining surviving advisories

- [ ] 5.1 Bump `@web/dev-server-esbuild` **separately** (it sits under the test runner, so a failure must stay attributable); run `pnpm -F @loom-js/core test-ci`.
- [ ] 5.2 Bump `turbo` 2.9.9 → 2.10.7 and refresh `vite` (4 alerts), `axios` (6), `js-yaml` (4), `ws` (3), `minimatch` (3), `ajv` (2), `contentful`, `esbuild`, `tsx` — several are already satisfiable inside their declared ranges, so a lockfile refresh may suffice.
- [ ] 5.3 Where no direct bump reaches a patched transitive, add a pnpm `override` — each recorded with the advisory it addresses and its removal condition. No blanket overrides.
- [ ] 5.4 Full green gate: `pnpm install`, `pnpm build-packages`, `pnpm build`, `pnpm -F @loom-js/core test-ci`, `pnpm -F @loom-js/core type-check`.
- [ ] 5.5 Confirm `@loom-js/core` still declares zero `dependencies` and zero `peerDependencies`, and that no published package gained a runtime dep.

## 6. Excluded manifests (2 alerts total — footnote, not a workstream)

- [ ] 6.1 Range-bump the single flagged dep in `apps/docs` and in `apps/sandbox`.
- [ ] 6.2 Validate against registry metadata only (the new range resolves to a published, non-vulnerable version). These are not installed, locked, or built — do not run a build to "confirm" them.
- [ ] 6.3 Label as unverified in the commit message and final summary; keep out of any green-baseline claim.

## 7. Record and close out

- [ ] 7.1 Write the accepted-advisory record: every advisory still open, with package, severity, and reason. `ip` belongs here — no published patch.
- [ ] 7.2 Re-run `pnpm audit` on `edge-2026` and report before/after against the 43-advisory baseline. Do **not** report GitHub's alert count as the success metric — it tracks `main`, which this change deliberately does not touch.
- [ ] 7.3 Confirm GitHub's `scope: runtime` classification (148 of 156) was not used to argue shipped-code exposure — verify against the published packages' manifests instead.
- [ ] 7.4 No changeset unless a published package's manifest changed; dev-tooling bumps are not user-visible.
- [ ] 7.5 Check `SOLID-AUDIT-REPORT.md` for any touched file; update `.claude/skills/skill-config.md` only if dependency or tooling conventions changed.
