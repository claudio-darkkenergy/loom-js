# Docs Grouped Side Nav

## Why

The side nav is a flat 13-item list. It reads as a sequence but not as a _structure_: the learning path's conceptual clusters (onboarding, templating, reactivity, server-first, reference) are invisible, and reference stops (configuration, diagnostics) sit indistinguishable from foundations. A grouped sub-nav organizes the concepts (maintainer direction, 2026-08-31) while keeping the flat learning-path order intact underneath. Groups render as native-disclosure collapsible sections — upstream pink's Collapsible markup (`<details>`/`<summary>`) whose CSS the pinned stylesheet already ships (maintainer direction, 2026-09-25).

## What Changes

- The `/docs` nav gains concept groups rendered as collapsible sections (native `<details>` disclosure); topics keep their exact flat order, partitioned contiguously — so derived prev/next pagination and the learning path are untouched.
- Grouping (maintainer signed off 2026-09-25; recorded in the align change's content map amendments):
    1. **Onboarding** — getting-started, bootstrapping, configuration
    2. **Templating** — components, element-syntax, custom-elements
    3. **Reactivity** — activities, routing, lazy-imports
    4. **Server-first** — server-rendering, hydration, dehydrated-state
    5. **Reference** — diagnostics (+ trailing utility topics as they land: feedback, build-tool)
- Grouping is CMS data, not app code: group = a `content` entry whose `content[]` links its topics (the existing nesting the model already allows — no model change); the `/docs` page's `content[]` lists groups.
- The group holding the active topic renders open (server included — the URL is known at render time); others collapse. Toggling is the browser's native `<details>` behavior — no client state, no toggle wiring.
- Sequenced **after `docs-feedback-topic`** — its trailing-utilities IA delta lands first; this change's delta builds on that text.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `docs-information-architecture`: the side-nav requirement becomes grouped — groups partition the map's flat order contiguously as collapsible sections, the active topic's group is open, and derived pagination still follows the flat order.

## Impact

- Contentful — 5 group entries; `/docs` page relinked to groups (topics move one level down). No model change (align D3 honored: `content.content[]` exists; the required `description` carries the group's one-line summary).
- `apps/loom` — GraphQL listing fragment gains one nesting level; `page` activity fan-out and `DocsSideNav` render groups; `TopicPagination` reads the flattened order.
- `packages/pink` — `PinkCollapsible` ported from upstream's Collapsible (markup only; the `.collapsible` CSS already ships — port approved 2026-09-25 per `docs-component-sourcing`), plus `PinkSideNav` `top` and the `PinkDropList.Item` export for the composition.
- `server-first-loom-app` interplay — its prerender enumeration reads topics through groups; noted for that change.
