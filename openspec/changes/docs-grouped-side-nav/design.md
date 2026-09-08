# Design — docs-grouped-side-nav

## Context

`DocsSideNav` renders `PinkSideNav` with flat `topLinkProps` derived from the `/docs` page listing; `TopicPagination` derives prev/next from the same flat order; `use-page-content` fetches the listing + topic in one GraphQL document. The `content` model already allows `content[]` → `content` nesting. Two IA deltas precede this: the 13-topic learning path (align change) and trailing utility topics (`docs-feedback-topic`).

## Goals / Non-Goals

**Goals:** visible concept structure; flat order preserved (pagination, learning path); active group expanded on server render; grouping maintained in the CMS beside the ordering it partitions.

**Non-Goals:** changing topic slugs/routes or the learning-path order; multi-level nesting (one group level); group landing pages (a group is nav structure, not a route — its `description` is a summary, unrendered for now); persisting manual expand/collapse across navigations.

## Decisions

### D1 — Groups are nested `content` entries, not app code and not a new type

A group is a `content` entry: `entryTitle`/`title` = group name, required `description` = one-line summary, `content[]` = its topics in order; the `/docs` page lists groups. IA then lives in one place (the CMS) next to the order it partitions — an app-side grouping map would drift from the CMS listing, and a new `topicGroup` type isn't forced (align D3) when the model's existing nesting expresses this exactly. The renderer distinguishes a group by its non-empty `content[]` links, so a flat listing still renders flat (graceful for any future page reusing the components).

### D2 — Accordion by composition; disclosure semantics; active group expanded at render

Composition-first per `docs-component-sourcing`: a nav-group section over pink's existing classes (`PinkDropList` / `.drop-section` as candidates), header as `<button aria-expanded>` controlling a labelled region — an upstream port only via the usual approval gate. Expansion state: the group containing the matched route renders expanded (server render included — the URL is known), others collapsed; a per-instance activity drives toggles with `bind` on the expanded class. Pre-hydration the buttons are inert (settle-and-swap inertness), which is acceptable because the relevant group is already open.

### D3 — Flat order is the source of pagination and of the groups

Groups partition the map's order contiguously; the app flattens group children back into the ordered topic list for `TopicPagination` and any order-derived logic. A verification task asserts flatten(groups) equals the map's order, so grouping can never silently reorder the path.

### D4 — Sequencing and the shared IA requirement

`docs-feedback-topic`'s delta (trailing utility topics) archives first; this change's MODIFIED requirement is written against that amended text and folds the trailing-utilities clause forward (trailing topics live inside the final Reference group). The GraphQL fragment change lands here; `server-first-loom-app`'s enumerator is pointed at the flattened listing (one-line note recorded in that change when this lands).

## Risks / Trade-offs

- [Group entries look like topics in the CMS] → the distinguishing signal (non-empty `content[]`) is a convention; documented in the content map's amendments and cheap to validate in the phase-style audit (a listed entry with links renders as a group, one with a body as a topic — an entry with both flags a review).
- [One request grows] → the listing fragment gains one nesting level in the same single document; no extra round trip.
- [Accordion hides the path's shape from first-time visitors] → the active group auto-expands and group headers remain visible in order; the getting-started "Where next" copy already narrates the path.

## Migration Plan

Entry work is additive drafts (groups created, page relinked) published together with the app change; rollback is relinking the page flat — the renderer's flat fallback (D1) keeps old and new listings both renderable during the switch.

## Open Questions

None — the grouping itself is review-gated in tasks (maintainer sign-off before entry work).
