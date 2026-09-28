# Design — readme-slim-down

## Context

Today's parity chain: README sections → content map → topics, enforced by `core-readme-accuracy` (README ↔ src) and `docs-content-coverage` (README ↔ topics). After align-phase-4 + server-first, every topic has a stable, prerendered URL, and the README's manual role is redundant with it. Pink already runs the target model (`docs-pink-section` D2/D4): map + source pointers anchor the docs; the package README is an npm card.

## Goals / Non-Goals

**Goals:** one canonical documentation home; a README a newcomer reads in two minutes that hands off cleanly; drift machinery that survives the inversion (topics still auditable against source).

**Non-Goals:** changing topic content; touching the server README entry docs (`@loom-js/core/server` inclusion lines live in topics already); starting before the sequencing gates; deleting the README's quick example (the two-minute read keeps one taste of the API).

## Decisions

### D1 — The slim README's exact scope

Pitch line, feature highlights (the bulleted list, each bullet linking its topic), install/inclusion, the components quick example, a "Documentation" section listing the learning path with absolute topic URLs, and Recognition. Everything else — concept sections, API reference, semantics, examples gallery — lives only on the site.

### D2 — Re-anchor via the pink pattern

The content map (or its successor artifact in this change) records per topic: outline + source pointers into `packages/core/src/**` and tests. `docs-content-coverage`'s propagation requirement re-words to fire on core changes ("a change altering consumer-visible core behavior updates the affected topics or records a follow-up"). The README stops being a link in that chain.

### D3 — Do it in one cut

No phased shrink: a long half-slimmed README is worse than either endpoint (two sources _and_ incomplete). One change rewrites the README, rewrites both spec deltas, and lands together — after the gates, the risk is low because nothing derives from the removed content anymore.

## Risks / Trade-offs

- [Offline/npm readers lose the manual] → the site is prerendered static HTML by the gate; npm keeps the two-minute card with working links; `git grep` still finds everything in topic sources under openspec archives and in Contentful.
- [Inbound links to README sections break] → GitHub renders anchors only for headings that remain; the Documentation section lists the canonical replacements. Acceptable for a pre-1.0 package.

## Migration Plan

Single change at the gates: README rewrite + both spec deltas + map re-anchor, one review, one publish. Rollback is `git revert`.

## Open Questions

None — scope questions resolve at apply time against the docs as published.
