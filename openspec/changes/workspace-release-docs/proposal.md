# Workspace Release Docs

## Why

The root `README.md` mentions the CI outcome in two bullets ("versions bumped & published to npm") but documents none of the release _workflow_: when to add a changeset, how the Version Packages PR flow works, the pre-1.0 versioning conventions, or the branch flow that gets a change to `main`. That knowledge lives in `CLAUDE.md`, workflow files, and maintainer memory — invisible to a contributor landing on the repo (maintainer request, 2026-09-08).

## What Changes

- A **Releases** section in the root `README.md`: add a changeset with every package change (`pnpm changeset`); preview with `pnpm status-packages`; on merge to `main` the publish workflow opens/updates the **Version Packages** PR, and merging _that_ PR publishes to npm — versions are never bumped by hand.
- Documented conventions alongside: pre-1.0 packages take **minor** for breaking changes (patch for fixes); private packages (`eslint-plugin`) stay unpublished until 1.0; app deploys ride the same merge to `main` via Vercel, independent of npm.
- Branch flow in brief: work branches → PR to `main`; `develop` syncs from `main` after release merges.
- Content stays a README section — short, pointing at `.github/workflows/publish-packages.yml` & the changesets docs rather than duplicating them.

## Capabilities

### New Capabilities

- `workspace-release-docs`: the root README documents the release workflow accurately and carries the drift obligation (release-process changes touch the section).

### Modified Capabilities

_None._

## Impact

- Root `README.md` only; no code, no changeset (README isn't a published package).
