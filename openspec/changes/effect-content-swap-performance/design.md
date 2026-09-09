# Design — effect-content-swap-performance

## Context

An activity effect re-render hands the slot a new ContextFunction. When the incumbent and incoming renders share a template, loom's micro-update path (attribute/node-level updates against the bound context) is the whole point of the architecture. The measured pathology appears when they do not share a template: the update path still attempts pairwise reconciliation across two large unrelated trees (docs topic A → docs topic B), costing ~1s of blocked main thread nearly independent of destination size, while `undefined` → content (fresh build into an empty slot) and content → `undefined` (teardown) are both cheap. Reproduction: production docs app, cached topic navigation, 2026-09-09 measurements in the proposal.

## Goals / Non-Goals

**Goals:** unrelated-content swaps cost teardown+build; same-template updates byte-identical in behavior and cost; the decision check itself is O(1)-ish (template identity), never a tree walk.

**Non-Goals:** keyed list reconciliation, cross-template DOM reuse heuristics, or any scheduling/time-slicing change — the swap stays synchronous, just proportional.

## Decisions

### D1 — Template identity is the swap discriminant

The compiled template (loom caches per tagged-template string) is the cheap, reliable identity: same template → existing micro-update path, unchanged; different template (or component identity) at the slot's top level → wholesale replace. Rationale: the template cache already gives O(1) identity, and "same template, different values" is precisely the case micro-updates are designed for — everything else is a swap.

### D2 — Wholesale replace reuses existing teardown and mount

No new machinery: the slot's replace composes the existing unmount teardown (subscription cleanup, context release) with a fresh detached build and single insertion — the same primitives the skeleton workaround exercises today, minus the intermediate render.

### D3 — Verify with a perf guard, not a benchmark suite

One spec builds two large unrelated trees (generated, deterministic) and asserts the swap completes within a generous multiple of the teardown+build baseline measured in the same run — a regression tripwire that stays environment-independent, not a micro-benchmark.

## Risks / Trade-offs

- [Some consumer depended on cross-tree patching preserving DOM state (focus, scroll) across unrelated content] → unrelated content preserving state was accidental, not contractual; called out in the changeset.
- [Template identity misses "same template via different modules"] → identity follows the template cache's own keying; two sources producing identical strings already share a cache entry.

## Migration Plan

Minor core release; no API change. The docs app removes its forced-skeleton workaround afterward (its own change).

## Open Questions

None — the exact hook point in `templating/` is implementation detail for the red-green pass.
