## Context

`packages/core/src/lib/reactive.ts` tracks dependencies as `deps: WeakMap<obj, Map<prop, Set<effect>>>`. `reactiveEffect(update, proxy)` wraps `update` in an `effect` closure, runs it once (setting `activeEffects` so property reads `track` it into the per-prop `Set`s), and returns nothing. There is no reverse index from an effect to the `Set`s holding it, so nothing can ever be removed. `activity.watch` (`activity.ts`) and `router.watchRoute` (`router.ts`) are thin wrappers over `reactiveEffect`; `watchRoute`'s JSDoc has always claimed to return an unsubscriber.

Effects re-run on every `trigger`, and each run re-`track`s every property read — `Set` semantics dedupe repeat additions. `trigger` iterates the live `Set` via `forEach`; per the ES spec, deletions during `Set.prototype.forEach` are honored (a deleted-but-not-yet-visited entry is skipped).

The unmount signal (`MutationObserver` → `'unmounted'` lifecycle in `lib/context/life-cycles.ts`) already exists but is _not_ wired here — this change is the manual-disposal slice; automatic teardown builds on it later.

Consumers this unlocks: component-scoped `watch` subscriptions can self-clean via the existing `onUnmounted` hook, which is the prerequisite for the deferred docs effect-boundary narrowing (archived `fix-docs-toc-duplication` design, D5 note).

## Goals / Non-Goals

**Goals:**

- Every `reactiveEffect` registration is disposable: a returned `dispose()` permanently removes the effect from all dependency `Set`s it occupies.
- `activity.watch` and `watchRoute` surface that dispose function as their return value.
- Disposal semantics are pinned by unit specs: stop-on-dispose, idempotent double-dispose, safe unsubscribe-during-trigger (self or sibling), no resurrection.
- Zero behavioral change for existing callers (return values were `void`/`undefined`; the addition is compatible).

**Non-Goals:**

- Automatic unmount-driven teardown (the `MutationObserver` wiring, `scopedActions` release, context-tree cascade) — the follow-on slice.
- Disposing `activity.effect` render effects — they are context-scoped and belong to the automatic slice.
- Any `lib/utils` or app changes — the hooks memoized in `fix-per-render-hook-leaks` are app-owned by design and must not be unsubscribed.

## Decisions

**D1 — Reverse index lives in the effect's closure, not a module map.** `reactiveEffect` keeps a local `memberships: Set<Set<Effect>>`; `track` records each `Set` the active effect is added to. On `dispose()`, iterate `memberships`, delete the effect from each `Set`, and clear the list. Alternative — a module-level `WeakMap<effect, Set<Set>>` — adds a second global structure for no benefit; the closure keeps ownership local and GC-friendly. Implementation note: `track` needs access to the active effect's membership list — carry it on the effect function itself (a property) or via a parallel `activeMemberships` slot next to `activeEffects`; prefer whichever reads cleaner, but do not widen the public `reactive` API.

**D2 — Dispose is a flag plus removal, so a disposed effect can never resurrect.** `dispose()` sets `disposed = true` in the closure before clearing memberships; the effect wrapper early-returns when `disposed`, so even a `trigger` that already captured the effect (or an in-flight run that would re-`track`) cannot re-register it. This makes double-dispose trivially idempotent and covers the unsubscribe-during-trigger case without touching `trigger` itself.

**D3 — Return a bare `() => void`, not an object.** `watchRoute`'s JSDoc says "an unsubscriber method"; a plain function composes directly with `onUnmounted(unsub)`. `matchQuery`'s `{ unsubscribeMql }` object shape is a `lib/utils` idiom, not core's; core exports stay minimal. Type it as a named exported type (e.g. `Unsubscriber = () => void`) in `types.ts` so `watch`/`watchRoute` signatures stay self-documenting.

**D4 — `trigger` iteration is left untouched.** `Set.forEach` already skips entries deleted mid-pass, and D2's flag guards the captured-before-delete race. Snapshotting the `Set` per trigger (`[...propDeps]`) was considered and rejected: it allocates on the hottest update path to solve a problem the flag already solves.

**D5 — `watch` returns the dispose directly; no bookkeeping in `activity`.** `watch(action)` becomes `return reactiveEffect(...)`. The activity keeps no registry of its watchers — that inversion (activity-owned subscription lists) is the automatic slice's concern, if it's needed at all.

## Risks / Trade-offs

- [Hot-path cost: one membership `Set.add` per tracked property read, one `Set` allocation per effect] → Bounded and tiny; but core tracks size/perf deltas, so the tasks include the bundle-size check and a before/after glance at the core test suite's timing. If the membership property lands on the effect function itself, no extra allocation per track occurs after the first.
- [A disposed watcher's closure may be retained until the last `Set` reference clears] → D2 clears memberships eagerly on dispose, so retention ends at dispose time; nothing waits for GC heuristics.
- [API addition without automatic cleanup may tempt consumers to treat manual unsubscribe as the final story] → The proposal and this design both name the automatic slice as deferred follow-up; the capability spec covers only disposal semantics, leaving room for the teardown capability later.
- [`activity.effect` remains non-disposable, so mixed usage inside one component may surprise] → Documented boundary: `effect` is render-scoped and context-managed; `watch` is caller-managed. The JSDoc for `watch` should state this explicitly.
