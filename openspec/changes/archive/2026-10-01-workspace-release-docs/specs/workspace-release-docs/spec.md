## ADDED Requirements

### Requirement: The root README documents the release workflow

The root `README.md` SHALL contain a Releases section covering: the changeset-per-change rule and commands (`pnpm changeset`, `pnpm status-packages`), the Version Packages PR flow (a push to `main` opens/updates it; merging it publishes; no manual version bumps), the pre-1.0 versioning conventions (breaking = minor; pink's next major is 2.0.0; private packages unpublished until 1.0), and the branch flow to `main` (work lands on `edge`; `edge` merges directly into `main`; `edge` resyncs from `main` after a release; outside contributions open pull requests against `edge`). Release-process changes SHALL update this section in the same change.

#### Scenario: a contributor releases from the README alone

- **WHEN** a contributor with a package change follows the Releases section
- **THEN** they add a changeset, land the change on `edge`, merge `edge` into `main`, merge the resulting Version Packages PR, and reach a published version without touching any version field by hand

#### Scenario: an outside contributor knows where to open a pull request

- **WHEN** a contributor without push access reads the Releases section
- **THEN** it tells them to open their pull request against `edge`, not `main`

#### Scenario: process changes keep the section true

- **WHEN** a change alters the publish workflow, versioning conventions, or branch flow
- **THEN** the same change updates the Releases section or records a follow-up
