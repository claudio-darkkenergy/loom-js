# Design — workspace-release-docs

## Context

Releases run on changesets: `publish-packages.yml` reacts to pushes on `main`, opening a "Version Packages" PR whose merge publishes. Conventions (pre-1.0 minors, burned pink 1.0.0, private eslint-plugin) live in CLAUDE.md/memory. The root README covers install/dev/filter plus two CI bullets.

## Goals / Non-Goals

**Goals:** a contributor can release correctly from the README alone; the section stays short and stable (process, not package specifics that churn).

**Non-Goals:** duplicating changesets' own docs; per-package version tables; automating anything.

## Decisions

### D1 — One README section, pointer-heavy

"Releases" after "CI Process" (folding those two bullets in): the changeset step, the Version Packages flow, the conventions, the branch flow — each a sentence or two, linking to the workflow file and changesets docs for depth. Rationale: the README is the front door, not the manual; short sections survive drift.

### D2 — State the conventions as rules, with their reasons

"Pre-1.0 breaking changes are minor bumps" and "pink can't take 1.0.0 (burned on npm — its next major is 2.0.0)" are recorded with the why, because they're exactly the tribal knowledge a new contributor would violate first.

## Risks / Trade-offs

- [Section drifts as process evolves] → the capability's drift obligation names the README section in any release-process change.

## Migration Plan

Single docs commit; no releases involved.

## Open Questions

None.
