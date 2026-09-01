# Docs Pink Section

## Why

`@loom-js/pink` is a published package with a growing surface (design-system components, behaviors, modifiers, the code-token theme) whose only documentation is Storybook and source. The core docs deliberately keep pink out of their examples (generic-components sweep, 2026-09-01) — which sharpens the gap: nothing on the docs site says pink exists, what it's for, or how to start with it. Like the build tooling, pink deserves its own documented home rather than cameos in core's topics (maintainer direction, 2026-09-01).

## What Changes

- The docs site gains a pink section — its own nav group under the grouped side nav (`docs-grouped-side-nav`'s Reference tail, or a sibling group; grouping review decides): an overview topic (what pink is, its relationship to `@appwrite.io/pink`, install/inclusion, theming basics) plus reference topics scoped at review (candidates: elements, components, behaviors + modifiers, code panels & highlighting wiring with `@loom-js/highlight`).
- Content is authored from pink's source and stories the way core topics are authored from the README — with a recorded source-of-truth convention so drift is checkable (pink has no README equivalent today; the map-style outline this change produces becomes that anchor).
- Storybook remains the component playground; the docs section owns concepts, install, and API reference, linking into Storybook rather than duplicating every story.
- **Sequenced after:** `docs-feedback-topic` (trailing-topics IA allowance) and ideally `docs-grouped-side-nav` (a pink group beats loose trailing topics); content authoring gates on a maintainer-reviewed outline, mirroring the align change's map review.

## Capabilities

### New Capabilities

- `docs-pink-coverage`: the pink section exists, is outlined against a reviewed content map, covers install/theming/component surface accurately to the shipped package, and carries the same drift obligation core topics carry against the core README.

### Modified Capabilities

_None — nav placement rides the grouped-side-nav / trailing-topics deltas._

## Impact

- Contentful — new topic entries under a pink group (model unchanged; same `content` nesting as `docs-grouped-side-nav`).
- `apps/loom` — none expected beyond the grouped nav (listing-driven).
- `openspec` — this change produces a pink content map artifact (its review gate) mirroring `align-loom-docs-with-core-readme`'s.
- Pink itself — no code; if outlining exposes API gaps or naming warts, they spawn their own pink changes.
