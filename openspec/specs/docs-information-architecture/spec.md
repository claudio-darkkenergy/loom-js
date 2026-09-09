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

The docs side nav SHALL list all topics in the content map's order (getting-started first, diagnostics last) and SHALL mark the currently selected topic.

#### Scenario: Ordered listing

- **WHEN** the docs page listing renders
- **THEN** topics appear in the content map's order, each linking to its `/docs/<slug>` route

#### Scenario: Current topic indicated

- **WHEN** a topic route is active
- **THEN** that topic's side-nav entry carries the selected state and no other entry does

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
