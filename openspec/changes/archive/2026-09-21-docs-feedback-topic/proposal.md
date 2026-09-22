# Docs Feedback Topic

## Why

`align-loom-docs-with-core-readme` scoped the docs listing to README parity, unlinking the pre-scrub `feedback` topic. The maintainer wants it back (2026-08-30 review): a feedback channel matters for an early framework — but its current body is a "Coming soon" placeholder, which is worse than absent. This change gives it a real body and a home at the tail of the nav, outside the learning path, so the parity contract over the 13 mapped topics stays intact.

## What Changes

- The existing `feedback` entry (`wQLhRMdC2tGF2CgJPAOSN`) gets a real body: where to file issues, where to discuss, what kind of feedback helps at this stage (authored via the same draft-review flow as the mapped topics).
- The `/docs` page listing appends `feedback` after `diagnostics` — the side nav gains a trailing-utility position after the learning path; prev/next pagination picks it up automatically (derived from the listing).
- The align change's content map gains the amendment note; the map's "exactly the mapped set" line becomes "the mapped set, then trailing utility topics".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `docs-information-architecture`: the side-nav requirement widens — the learning path (mapped set, in order) SHALL come first, and non-README trailing utility topics MAY follow it.

## Impact

- Contentful: `feedback` entry body + `/docs` page listing tail. No model change.
- `apps/loom`: none expected (listing-driven nav and pagination already derive).
- `openspec/changes/align-loom-docs-with-core-readme/content-map.md`: amendment recorded (done with this proposal).
