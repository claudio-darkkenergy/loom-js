# docs-information-architecture Specification

## Purpose

Defines the docs section's shape in `@loom-js/loom`: one topic per consumer-facing concept in `packages/core/README.md` (per the change's content map), each reachable at `/docs/<slug>`, a side nav listing topics in learning-path order with the current topic marked, previous/next navigation derived from the listing order, and client-side (SPA router) navigation for cross-topic links.

Established by the `align-loom-docs-with-core-readme` change (2026-08-28).

## Requirements

### Requirement: One docs topic per core README concept

The docs section SHALL expose one topic per consumer-facing concept in `packages/core/README.md`, per the change's content map: `getting-started`, `bootstrapping`, `configuration`, `components`, `element-syntax`, `custom-elements`, `activities`, `routing`, `lazy-imports`, `server-rendering`, `hydration`, `dehydrated-state`, `diagnostics`. Each topic SHALL be reachable at `/docs/<slug>`.

#### Scenario: Every mapped topic resolves

- **WHEN** a user navigates to `/docs/<slug>` for any slug in the content map
- **THEN** the docs layout renders that topic's content (not a skeleton that never resolves, and not another topic's content)

#### Scenario: Concept sub-sections stay in-page

- **WHEN** a topic's README source has sub-sections (e.g. activity transforms, custom-element shadow DOM)
- **THEN** they render as headings within that topic — anchored for the on-page TOC — rather than as separate routes

### Requirement: Side nav lists topics in learning-path order

The docs side nav SHALL present the content map's topics in the map's order, partitioned contiguously into named concept groups rendered as collapsible sections; the group containing the active topic SHALL render open (including in server-rendered markup), the selected topic SHALL be marked, and trailing utility topics (non-README topics such as `feedback`) SHALL appear within the final group after the mapped set. Flattening the groups' children SHALL reproduce the content map's exact order.

#### Scenario: Grouped, ordered listing

- **WHEN** the docs page listing renders
- **THEN** group sections appear in map order, each listing its topics in map order, and flattening the groups yields the map's exact topic sequence

#### Scenario: Active group open

- **WHEN** a topic route is active
- **THEN** that topic's group renders open with the topic's entry marked selected, and no other entry is marked

#### Scenario: Collapsed groups toggle

- **WHEN** the reader activates a collapsed group's header
- **THEN** the group opens (and can collapse again) without navigation or page reload

#### Scenario: Derived navigation follows the flat order

- **WHEN** prev/next pagination renders for any topic
- **THEN** it follows the flattened listing order, crossing group boundaries as if the listing were flat

### Requirement: Topics link to adjacent topics

Each topic view SHALL render previous/next navigation derived from the page listing order — no separately authored pagination data.

#### Scenario: Middle topic

- **WHEN** a topic that has both a predecessor and a successor in the listing renders
- **THEN** previous and next links point to those adjacent topics' routes

#### Scenario: Boundary topics

- **WHEN** the first (or last) topic in the listing renders
- **THEN** only the next (or only the previous) link renders — no dead link

### Requirement: Cross-topic links navigate client-side

Links within topic content that target `/docs/<slug>` SHALL navigate via the SPA router (History API) rather than a full document load.

#### Scenario: In-content topic link

- **WHEN** a user activates a link to another docs topic inside topic content
- **THEN** the app routes client-side and the target topic renders without a page reload
