## MODIFIED Requirements

### Requirement: One docs topic per core README concept

The docs section SHALL expose one topic per consumer-facing concept in `packages/core/README.md`, per the change's content map — the mapped set including `fragments`, which sources from multiple README passages (the recorded exception: a concept topic justified by discoverability rather than a single README section). Each topic SHALL be reachable at `/docs/<slug>`.

#### Scenario: Every mapped topic resolves

- **WHEN** a user navigates to `/docs/<slug>` for any slug in the content map
- **THEN** the docs layout renders that topic's content (not a skeleton that never resolves, and not another topic's content)

#### Scenario: Concept sub-sections stay in-page

- **WHEN** a topic's README source has sub-sections (e.g. activity transforms, custom-element shadow DOM)
- **THEN** they render as headings within that topic — anchored for the on-page TOC — rather than as separate routes

#### Scenario: Sought concepts carry headings

- **WHEN** the sweep identifies a concept readers would seek by name (per the reviewed sweep artifact)
- **THEN** that concept is reachable through a heading — its own topic or a named section — not only through prose inside another section

#### Scenario: Consolidated concepts leave pointers

- **WHEN** material moves from a topic into a concept home (e.g. fragment rules into the fragments topic)
- **THEN** the vacating sites keep brief pointers to the new home, and cross-links/anchors update in the same change
