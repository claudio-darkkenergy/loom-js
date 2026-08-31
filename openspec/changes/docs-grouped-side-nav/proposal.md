# Docs Grouped Side Nav

## Why

The side nav is a flat 13-item list. It reads as a sequence but not as a _structure_: the learning path's conceptual clusters (getting going, components, reactivity, server-first, reference) are invisible, and reference stops (configuration, diagnostics) sit indistinguishable from foundations. An accordion-style sub-nav organizes the concepts (maintainer direction, 2026-08-31) while keeping the flat learning-path order intact underneath.

## What Changes

- The `/docs` nav gains concept groups rendered as accordion sections; topics keep their exact flat order, partitioned contiguously — so derived prev/next pagination and the learning path are untouched.
- Proposed grouping (maintainer reviews before entry work, map-style):
    1. **Getting going** — getting-started, bootstrapping, configuration
    2. **Components** — components, element-syntax, custom-elements
    3. **Reactivity** — activities, lazy-imports
    4. **Routing** — routing
    5. **Server-first** — server-rendering, hydration, dehydrated-state
    6. **Reference** — diagnostics (+ trailing utility topics as they land: feedback, build-tool)
- Grouping is CMS data, not app code: group = a `content` entry whose `content[]` links its topics (the existing nesting the model already allows — no model change); the `/docs` page's `content[]` lists groups.
- The group holding the active topic renders expanded (server included — the URL is known at render time); others collapse; toggles are client-side.
- Sequenced **after `docs-feedback-topic`** — its trailing-utilities IA delta lands first; this change's delta builds on that text.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `docs-information-architecture`: the side-nav requirement becomes grouped — groups partition the map's flat order contiguously, the active topic's group is expanded, and derived pagination still follows the flat order.

## Impact

- Contentful — ~6 group entries; `/docs` page relinked to groups (topics move one level down). No model change (align D3 honored: `content.content[]` exists; the required `description` carries the group's one-line summary).
- `apps/loom` — GraphQL listing fragment gains one nesting level; `page` activity fan-out and `DocsSideNav` render groups; `TopicPagination` reads the flattened order.
- `packages/pink` — accordion section component, **composition-first** per `docs-component-sourcing` (candidates: `PinkDropList` / upstream `.drop-section`); any upstream port needs the usual approval.
- `server-first-loom-app` interplay — its prerender enumeration reads topics through groups; noted for that change.
