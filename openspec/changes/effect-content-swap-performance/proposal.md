# Effect Content-Swap Performance

## Why

Replacing an effect slot's rendered content with different content blocks the main thread for ~1s on real pages, near-constant regardless of either tree's size. Measured on the production docs app (2026-09-09): navigating between cached topics — zero network, pure render — starved a 16ms timer for 1.7s in the worst run (~970-1010ms typical), while the same destination content built in ~50-150ms when the slot was first cleared to a skeleton. The delta isn't teardown and isn't build — it's the in-place patch walk the templating layer runs when the old and new trees are large and structurally unrelated. Consumers currently work around it by routing every swap through a cheap intermediate state (the docs app's forced skeleton), which costs an unnecessary flash on cached revisits.

## What Changes

- Core's effect-slot update path detects a **content swap** — the incoming render is not the same template as the incumbent — and replaces wholesale (teardown + fresh build) instead of walking both trees pairwise. Same-template re-renders (the common update path) keep the existing micro-update behavior untouched.
- Instrumented before/after against the reproduction (large rich-text tree → different large rich-text tree): the swap SHALL land in the same order of cost as skeleton-mediated replacement (~150ms-class, content-proportional), not the ~1s-class cross-tree walk.
- The docs app drops its forced-skeleton workaround for cached revisits once this lands (tracked there, not here).

## Capabilities

### New Capabilities

- `effect-content-swap`: replacing an effect slot's content with structurally different content costs teardown-plus-build, proportional to the trees involved — never a cross-tree patch walk.

### Modified Capabilities

_None — same-template micro-update behavior is explicitly preserved._

## Impact

- `packages/core/src/lib/templating/` (slot update path) + `context/`; behavior-preserving for matching templates — the full core suite must stay green.
- Tests: TDD spec pinning the swap path (teardown+build invoked, no attribute-walk across unrelated trees) + a perf guard scenario.
- **Minor** core changeset. The docs app follow-up (remove the forced skeleton for cached keys) rides a separate change once shipped.
