## Purpose

Defines the project's obligations around dependency advisories — that the installed workspace carries no known critical or high advisory with an available patch, that alert counts are read against the branch they actually describe, that published-package dependency surface stays minimal, and that any knowingly-accepted advisory is documented with a reason rather than left unexplained.

## Requirements

### Requirement: Installed workspace carries no patchable critical or high advisory

The dependency tree described by `pnpm-lock.yaml` SHALL NOT contain a known critical- or high-severity advisory for which a patched version is published and reachable by upgrading a direct dependency. Moderate and low advisories are not required to be zero, but SHALL be reported.

#### Scenario: Audit reports no patchable critical or high advisory

- **WHEN** `pnpm audit` is run at the repo root against the committed `pnpm-lock.yaml`
- **THEN** it reports zero critical-severity advisories that have a published patch
- **AND** zero high-severity advisories that have a published patch
- **AND** any remaining critical or high advisory appears in the accepted-advisory record with a reason

#### Scenario: Remediation prefers a direct dependency upgrade

- **WHEN** an advisory is reached through a transitive dependency
- **THEN** remediation upgrades the top-level dependency that pulls it in, so the parent resolves its own patched transitive
- **AND** a pnpm `override` is used only where no direct upgrade reaches a patched version

#### Scenario: Every override is justified and removable

- **WHEN** a pnpm `override` is added to force a transitive version
- **THEN** it is recorded with the advisory it addresses and the condition under which it can be removed

### Requirement: Dependency remediation preserves a green build and test baseline

A dependency upgrade SHALL NOT be accepted on the basis of a reduced advisory count alone. The install, package build, app build, and core test suite SHALL all remain green after the upgrade.

#### Scenario: Baseline verified after remediation

- **WHEN** dependency versions have been changed and `pnpm-lock.yaml` regenerated
- **THEN** `pnpm install` completes without error
- **AND** `pnpm build-packages` and `pnpm build` succeed
- **AND** `pnpm -F @loom-js/core test-ci` passes with no failing tests

#### Scenario: Vercel-dependent dev flow verified by a real request

- **WHEN** the `vercel` dependency is upgraded across a major version
- **THEN** `pnpm api` serves an actual request against a `services/api/*` handler
- **AND** verification is not satisfied merely by the dev server process starting

### Requirement: Advisory claims distinguish verified from unverified manifests

Manifests that are excluded from `pnpm-workspace.yaml` are not installed, not locked, and not built, so changes to them cannot be verified by install, build, or test. Remediation of such manifests SHALL be reported as best-effort and SHALL NOT be presented as verified.

#### Scenario: Excluded manifest bump is labelled unverified

- **WHEN** a dependency range is changed in a git-tracked but workspace-excluded manifest (e.g. `apps/docs`, `apps/sandbox`, `lib/*`)
- **THEN** the change is validated only against registry metadata, confirming the new range resolves to a published non-vulnerable version
- **AND** it is reported as unverified rather than counted toward the green build and test baseline

### Requirement: Dependabot alerts remain readable by the triage tooling

The project SHALL maintain a credential with sufficient permission to read Dependabot alerts via the GitHub API, so that alert triage is driven by the actual alert list rather than by a local-audit proxy.

#### Scenario: Alert list is retrievable

- **WHEN** the Dependabot alerts endpoint is queried for the repository
- **THEN** it returns the alert list rather than a 403 authorization error

#### Scenario: Credential is least-privilege and never committed

- **WHEN** a token is provisioned for alert access
- **THEN** it grants no more than read access to Dependabot alerts for this repository
- **AND** it is not committed, written into a tracked file, or echoed into command output

#### Scenario: Reported counts are reconciled across sources

- **WHEN** the GitHub alert count and the local `pnpm audit` count disagree
- **THEN** the discrepancy is explained against the actual alert data
- **AND** the explanation identifies which manifests each source covers

### Requirement: Knowingly-accepted advisories are documented

An advisory that is left open SHALL be recorded in a tracked file with the reason it was accepted, so that a non-zero alert count remains meaningful and a future reader can distinguish a triaged decision from an untriaged backlog.

#### Scenario: Accepted advisory carries a reason

- **WHEN** an advisory is left unremediated
- **THEN** a tracked record names the advisory, the affected package, and the reason — no published patch, the fix requires an unacceptable break, or the code path is not reachable in this project's usage

#### Scenario: Published package dependency surface stays minimal

- **WHEN** dependency remediation is performed
- **THEN** `@loom-js/core` still declares zero dependencies and zero peer dependencies
- **AND** no advisory remediation adds a runtime dependency to a published package
