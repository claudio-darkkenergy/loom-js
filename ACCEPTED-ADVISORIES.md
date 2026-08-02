# Accepted Dependency Advisories

This file records every known dependency advisory that is deliberately left
open, with the reason it was accepted. Its purpose is to keep a non-zero
advisory count meaningful: an advisory listed here was triaged and accepted;
an advisory not listed here has not been looked at. Maintain it whenever
`pnpm audit` reports something that is not going to be fixed immediately.

Valid reasons for accepting an advisory:

- **No published patch** — no fixed version exists in any release line.
- **Unacceptable break** — the only patched version requires a breaking change
  that has been evaluated and rejected, with the evaluation summarized here.
- **Not reachable** — the vulnerable code path cannot be exercised in this
  project's usage, with the argument written out (not merely asserted).

## Currently accepted advisories

**None.** As of 2026-08-02, `pnpm audit` (full and `--prod`) reports zero known
vulnerabilities on the committed `pnpm-lock.yaml`.

Notes from the last remediation pass (`openspec/changes/fix-dependency-vulnerabilities`):

- The `ip` advisory (the one alert with no published patch) no longer applies:
  `ip` left the dependency tree entirely when `vercel` moved to 58.x.
- Nine pnpm `overrides` force patched transitives that the `vercel` CLI still
  pins. Each is documented inline in `pnpm-workspace.yaml` with its GHSA ids
  and removal condition. Overrides are not accepted advisories — they are
  remediations — but they are the most likely thing to rot, so check them
  when touching dependencies.
- GitHub's Dependabot alert count tracks the default branch (`main`). While
  `main` trails the working branch, its count describes `main`'s stale
  lockfile, not the state of this tree — reconcile by GHSA id before treating
  it as a backlog.
