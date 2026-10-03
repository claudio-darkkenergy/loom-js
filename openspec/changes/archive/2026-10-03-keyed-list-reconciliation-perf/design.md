# Design — keyed-list-reconciliation-perf

## Context

```
rows.update(next) ──► effect renderEffect ──► textUpdater(ctx.root, items, ctx) ──► handleArrayValue
   per item i:  getContextForValue(item) [dry-run render → key] ──► appendChildContext(ctx, item, key) [name check!]
                ──► resolveValue(item, childCtx) [full template pass] ──► entries.findIndex(...) [O(n)] ──► insertBefore cursor
```

`handleArrayValue` (`get-text-update.ts`) is the one reconciler for array slots, effect roots included. Per pass it dry-runs every component item to read its key (a fresh context with `Map`, `Set`, life-cycle closures and a bound parser each time), reconciles by walking the new list with a cursor into the previous entries and `findIndex`-ing any item that is not already at the cursor — O(n²) once anything shifts, and a DOM `insertBefore` for every shifted item — and renders every item regardless of whether its props changed. Removed keys stay in the parent's `children` map. Three sites test context functions with `value.name…endsWith('contextfunction')` although `contextFunctionKind` (a marker set at creation) exists for exactly that; `@loom-js/build` sets `keepNames: true`, which is why the docs app never showed it.

Measured 2026-10-03 (M1 Max, Chrome 153, `pnpm bench`, ms, 1 000 rows):

| op            | vanilla | loom today | loom with the marker fix only |
| ------------- | ------- | ---------- | ----------------------------- |
| createRows    | 18.1    | 48.6       | 56.2                          |
| partialUpdate | 2.8     | 63.9       | 11.4                          |
| swapRows      | 1.5     | 57.3       | 31.7                          |
| removeRow     | 1.6     | 58.5       | 32.2                          |
| appendRows    | 19.6    | 129.9      | 64.8                          |

DOM mutation counts with the marker fix: swap = 997 `insertBefore` (vanilla 2), remove = 998 `insertBefore` + 1 `remove` (vanilla 1), partial update = 1 000 `setAttribute class` with the same value (the `bind` re-created per row render) + 100 text replacements, append = every new row's text slots replaced twice.

## Goals / Non-Goals

**Goals:**

- Keyed items keep their DOM and context in every build, minified or not.
- A reorder costs the minimum number of DOM moves; a removal costs none; an append touches only the new items.
- Reading an item's key allocates nothing.
- An item whose props did not change does not re-run its template.
- Removed items release their child context.
- Bench target: geometric mean < 2× vanilla, every op < 3×.

**Non-Goals:**

- Changing the public template or `key` syntax.
- Unkeyed reconciliation (stays index-positional).
- The per-instance context footprint (heap 8.8 MB vs ~2 MB) — measured again after this lands; a follow-up if it is still out of line.
- Attribute-binding reuse across renders (`bind` creating a new binding per render) — mostly mooted by render skipping; revisit if partial update stays above 3×.

## Decisions

### D1 — One detector: `contextFunctionKind`, never `Function.name`

`isContextFunction` / `isActivityContextFunction` (already marker-first) become the only tests. `appendChildContext`, the html-parser's `reactive` value diff and `get-attr-update`'s style-arg branch call them. The name fallback inside `contextFunctionKind` stays for values from older core copies, as its comment says. A core test builds a minified fixture (esbuild `minify: true`, no `keepNames`) and asserts keyed node identity across an update.

### D2 — Keyed diff: index the old entries, move only what the LIS leaves out

```
old entries ──► Map<key, entry>            (one pass)
new items   ──► for each: key, entry = map.get(key) ?? render new
            ──► oldIndex[] of reused items ──► LIS ──► items not in LIS move (insertBefore next kept sibling, walking from the end)
            ──► keys absent from new: remove nodes, release child context, (teardown observes the detach as today)
```

The entry store already keeps per-item node groups; the rewrite keeps groups as the unit. Unkeyed items keep index keys, so the same code path serves both (an index-keyed list naturally has no moves). Correctness pins: the existing `activity-array-reactivity` scenarios (falsy keys, numeric keys, fragment groups, empty-group anchors) plus new ones for move counts (observed through a `MutationObserver` in the test).

_Alternative rejected:_ keep the cursor walk and only replace `findIndex` with a map — fixes the O(n²) but still moves every shifted row on a removal.

### D3 — Key on the context function, set at creation

`component()` already assigns `contextFunction.contextFunctionKind`; it also assigns `contextFunction.key = props.key`. The reconciler reads `value.key` for component kinds and uses the index otherwise. `getContextForValue` stays (it is the snapshot API) but the reconciler no longer calls it per item. Activity context functions have no key today and keep index behavior.

### D4 — Skip the render when props are shallow-equal

In `contextFunction(liveCtx)` on a live context (root present, same template fingerprint): if every own key of the new input props is `Object.is`-equal to the previous `ctx.props` (same key set; `children` compared by reference, `ref` excluded) the function returns the context as-is — no template call, no life-cycle `rendered`. Everything that makes a render necessary still does: an activity the instance subscribes to (its own effect, independent of the parent), a changed prop, a changed children array reference, a fingerprint change, a first render, a remount.

Semantics, written into the Components topic: a component instance re-renders when a prop changes or when an activity it subscribes to updates — a parent's re-render alone does not re-run a child whose props are unchanged. Render-time reads of non-reactive values were already only refreshed by chance (a parent re-render); the topic says so plainly and points at `activity` for anything that should track.

_Alternative rejected:_ an opt-in `memo` wrapper — an escape hatch where the default should be right; the only code it would protect is code relying on parent re-renders to re-read non-reactive state, which the docs do not endorse.

### D5 — Removed keys release their context

When a key is absent from the new list, its entry's nodes are removed and `parentCtx.children.delete(key)` runs. Teardown of subscriptions and `unmounted` still come from the existing detach observation (`unmount-teardown`), unchanged.

### D7 — Bindings write only on a changed projection (added during apply)

Profiling `selectRow` after D1–D5 showed 1 000 same-value `setAttribute` calls per select: every row's `bind` re-applied its projection. `bindAttr` now keeps the last applied value and skips the write when `select` yields the same one (`Object.is`). Spec delta under `reactive-attr-bindings`.

### D8 — Path memo keyed by identity (added during apply)

`setUpdatesForPaths` memoized `getDynamicElement` under a `JSON.stringify` of its arguments, per path per render — ≈10 % of `createRows` script time. The cached parse hands out one path array per path, so the memo keys by that array. No behavior change.

### D6 — Evidence is the bench

Tasks run `pnpm bench` before and after (same machine, same session) and record both results in the archive note; the targets in Goals gate the change. The results file is not committed (turbo output), the numbers are.

## Risks / Trade-offs

- [Render skipping changes when a child re-renders] → documented rule (D4); core tests pin the forced cases; the sandbox and docs app are the live canaries.
- [LIS rewrite regresses a fragment-group or falsy-key case] → the existing array spec scenarios are the regression suite; TDD per task.
- [Detection fallback by name is dropped somewhere it mattered] → `contextFunctionKind` keeps its name fallback; only the three raw checks change.
- [Context release races teardown] → release is a map deletion; teardown reads the context it already holds. Tested by a remove-then-update sequence.
- [Numbers move with hardware] → both measurements in one session on one machine; ratios to vanilla are the gate.

## Migration Plan

1. D1 first (its own commit — a straight bug fix, measurable alone).
2. D3, then D2 + D5 behind the existing array specs.
3. D4 with its tests and the topic update.
4. Bench before/after; changeset (minor); archive.
5. Rollback: revert the commit(s); no data or API migration.

## Open Questions

None. D4's default-on is the decision; veto it and the change ships D1–D3 + D5 (expected partial update ≈ 4×, swap/remove ≈ 2×, append ≈ 3×).
