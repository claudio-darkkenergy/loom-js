# add-client-hydration — design

## Context

The render path already does almost everything hydration needs: `htmlParser` builds each component's live tree fully off-DOM, reactive updates run happily against detached nodes (the server render relies on this), and `mount()` (`lib/mount.ts`) is the only step that touches the destination root — a single `replaceChildren`. What's missing is (1) a boot entry that _defers_ that one step until the app is worth showing, and (2) a way to know when that is.

"Worth showing" is the crux. `init()` on a pre-rendered page wipes the server HTML into the shell/fallback immediately, and lazy route content plus data-driven effects land afterwards — two visible flashes. The server solved its version of this ("when is markup done?") with a bounded markup-quiet polling drain in `renderToString`. The client deserves a real signal instead: `activity.update()` (`activity.ts:175-185`) invokes the transform and discards its return value — an async transform's promise is exactly the pending work we're currently blind to. All framework-mediated async — `lazyImport`'s import activity, the router's page-import activity, app data activities with async transforms — flows through that one call site.

Strategy was settled during exploration (explicit user pick): **settle-and-swap**, not adopt-in-place. Byte-identical markup makes adoption's remaining advantage (DOM identity: focus/selection/iframe state) marginal, and adoption requires marker comments in server output plus deep surgery in `lib/templating` — the highest-blast-radius area of core. Loom is a general product: the API must serve any pre-rendering consumer, not the docs app's shape specifically.

Constraints: zero runtime dependencies; non-hydrating apps must not pay bytes (tree-shakeable entry, prior budgets: `RouteLink` 134 B, `el()` 132 B); anything DOM-shaped resolves through the provider seam (`getWindow`/`getDocument`); per-window isolation for anything stateful (the Router precedent); `noUncheckedIndexedAccess`-strict TS.

## Goals / Non-Goals

**Goals:**

- A hydrating boot entry: pre-rendered DOM stays visible and untouched until one atomic swap.
- The swap waits for the app to settle — lazy route content _and_ async activity work — so data-driven pages never regress to placeholders mid-boot.
- A public settled signal usable beyond hydration (tests; future unification of the server drain).
- Lifecycle parity with `init`: `onCreated`/`onRendered` timing unchanged; `onMounted` fires at the swap (real DOM attachment), `onAppMounted` after it.
- Bounded worst case: an app that never settles still boots.

**Non-Goals:**

- No adopt-in-place / DOM claiming; no hydration markers in server output (future extension of `server-rendering`).
- No dehydrated state or request-cache priming — with a settled signal that's a duplicate-fetch cost, not a correctness gap; follow-up change.
- No server-drain rewrite onto the settled signal in this change (noted as future).
- No streaming/partial hydration.

## Decisions

### D1 — Separate `hydrate()` entry, not an `init` option

`hydrate({ app, root, ... })` is a sibling of `init` sharing the same bootstrap/config internals (factored, not duplicated). An options-flag on `init` would put hydration code in every bundle; a separate export tree-shakes to zero for non-hydrating apps. Signature mirrors `AppInitProps` minus `append` (meaningless for a takeover — the swap is always a replace), plus settle options (D4). `root` carries the pre-rendered markup; the same head/body guard as `init` applies.

Alternative considered: `init({ hydrate: true })` — rejected on tree-shaking; also the two boots have different contracts (immediate mount vs deferred swap) and a boolean hiding that is the kind of API a general product regrets.

### D2 — Settlement is counted where async work already funnels: the activity transform

`activity.update()` is the single call site every framework-mediated async operation passes through. When a transform returns a thenable, a per-window pending counter increments, and decrements when it settles (resolve _or_ reject — a failed import still ends the wait). Cost to non-hydrating apps: one `typeof`/thenable check per transform-ful update — O(1), no allocation on the sync path.

The counter is per-window state resolved through the provider seam (Router precedent), so concurrent server renders — or a future server-drain unification — can't cross-talk.

Alternatives considered:

- Markup-quiet polling on the client (symmetric with the server drain) — rejected: it's a heuristic where a signal is buildable, and polling wall-clock delays every boot by at least one quiet window.
- Instrumenting `fetch`/promises globally — rejected outright: zero-dep loom doesn't monkey-patch platform APIs.

**Boundary (documented, load-bearing):** async work that doesn't flow through an activity transform — a raw `fetch` inside a `watch` callback that calls `update` later, a `setTimeout` — is invisible to the counter. The framework-idiomatic path (async transforms) is tracked; escape hatches aren't. D4's `maxWait` and D5's `ready` option are the pressure valves.

### D3 — Settled = pending-count zero-crossing confirmed by one macrotask of quiet

Settlement is not "count is currently 0" — chains re-arm it (a route import resolves → its render triggers a nested `lazyImport` → count rises again; dynamic `import()` settles beyond the microtask queue). The signal: after the count returns to 0, yield one macrotask; if the count is still 0, settled. Mirrors the server drain's chain-handling (`MAX_DRAIN_PASSES` yields) but event-driven — no markup comparison, no fixed pass count, and an already-settled app (no async at all) resolves on the first check, adding one macrotask to boot.

Polling activities (interval-driven refresh) don't wedge this: their count returns to 0 between cycles, and the first quiet zero-crossing wins.

### D4 — `maxWait` bounds the worst case; the swap always happens

An app that opens a never-resolving async transform at boot (long-poll, SSE-wrapped-in-transform) would otherwise never swap. `hydrate` takes `maxWait` (ms, default 4000): on expiry, swap with whatever has rendered, and emit a `loomConsole` warning naming the pending count — silent fallback would mask real bugs. `maxWait: Infinity` opts out. Default rationale: past typical LCP budgets, short enough that a wedged boot is still a usable page.

### D5 — Public surface: `settled()` promise + optional `ready` gate

- `settled(): Promise<void>` — exported from core: resolves per D3 for the current window scope. Publicly useful (test await points; the future server-drain unification consumes exactly this), and hydrate's own gate, so it's spec'd behavior rather than an internal.
- `hydrate({ ready })` — optional `Promise<unknown>`: when supplied, the swap awaits `Promise.all([settled(), ready])` (still bounded by `maxWait`). This is the app-owned escape hatch for D2's boundary — untracked async the app knows about (font loading, a raw fetch) without loom growing tracking for every async shape.

### D6 — Swap mechanics and lifecycle timing

`hydrate` renders the app context off-DOM (the render path needs no attachment), starts `_lifeCycles.observe(root)` _before_ the swap, then performs `mount(root, appCtx, null)` — the existing single `replaceChildren`. The observer therefore sees the swap as the mount event: `onMounted` fires for the whole tree at real DOM attachment (same semantics as `init`, where mounting is also one `replaceChildren`), and `onAppMounted` runs after the swap. Pre-swap, the server DOM receives no listeners: native anchors still navigate (full page load — acceptable pre-interactive degradation), other interaction is inert. Document this; the mitigation is that settle windows are short and bounded.

An empty `root` (no pre-rendered markup — e.g. dev server without SSG) degrades gracefully: same deferred-swap path, just swapping into an empty root. No behavioral fork.

### D7 — Pre-swap re-renders may rebuild component instances; accepted for v1

`htmlParser`'s instance-freshness check (`html-parser.ts:87-94`) treats a root not contained in the document as a fresh instance. The server never hits this (it mounts into the injected document's body immediately); a detached hydrate tree does — an effect update landing _before_ the swap re-runs the first-render path for that subtree instead of updating in place. Output is correct (it's the same path first render takes, with current values); the cost is redundant node construction during a short, bounded window. Accepted for v1 rather than widening the containment check with a hydration-aware seam — that check guards genuine staleness and touching it has framework-wide blast radius. Revisit only if apply-phase tests show observable breakage (e.g. lifecycle double-fires), in which case the narrow fix is teaching the check about the hydrate container, not removing it.

## Risks / Trade-offs

- **[Untracked async (D2 boundary) makes `settled()` resolve early]** → documented boundary + `ready` gate (D5) + `maxWait` floor (D4); README positions async transforms as the idiomatic data path (framework-idiom-first).
- **[Instrumentation on every `activity.update`]** → one thenable check on the transform return; measured in the byte/perf budget; no cost when no transform.
- **[Double render cost: server rendered it, client rebuilds it]** → inherent to settle-and-swap; the trade accepted when choosing it over adoption. Dehydration follow-up cuts the duplicate _fetches_, which dominate.
- **[Transient user state in server DOM lost at swap (form input, selection)]** → inherent; bounded window; adopt-in-place remains the future answer if a consumer class actually needs it.
- **[Swap-time layout shift if client markup ≠ server markup]** → same code path renders both (the server-rendering capability's core guarantee), so divergence is app nondeterminism (time/random) — an app bug the swap self-heals rather than a framework invariant to enforce.
- **[D7 rebuilds could double-fire creation-phase hooks pre-swap]** → covered by explicit test scenario in apply; fallback plan named in D7.
- **[`maxWait` default wrong for some consumer]** → it's an option; default documented with rationale.

## Open Questions

- None blocking. `settled()`'s exact export name is finalize-at-apply (collision check against the public surface).

## Apply-phase findings

- **Export name finalized:** `settled` — no collision on the public surface.
- **D6 refinement — observer starts after the swap, not before.** `_lifeCycles.observe` couples starting the `MutationObserver` with a synchronous sweep that both fires `onMounted` for contained registrations _and purges detached ones_. Called pre-swap it would purge the whole (deliberately detached) hydrate tree, so `onMounted` would never fire. Post-swap `observe` gives the identical observable semantics as `init` (mounted fires synchronously at attachment, before `onAppMounted`) with zero blast radius in `life-cycles.ts`; verified by the lifecycle-timing spec. The sweep's purge branch also cleans up any D7-orphaned detached registrations.
- **D7 breakage surfaced; named fallback applied.** The pre-swap effect-update test observably double-fired `onCreated` (the rebuild re-enters the creation hook with a fresh root node). Fallback per D7: `lib/hydrating-roots.ts` — a registry of in-flight hydrate roots that widens the `htmlParser` containment check to "attached, or inside a pending hydrate tree". Non-hydrating apps exit the check on `size === 0`; the staleness guard is untouched.
- **API note:** `hydrate` returns `Promise<void>` (resolves after the swap and `onAppMounted`) — an inherently async boot; additive next to `init`'s contract.
- **Byte budget (esbuild `--bundle --minify`, gzip -9, measured against the pre-change dist):**
    - Hydrate entry (`init`+`hydrate` bundle vs `init`-only): **+976 B min / +483 B gzip** — paid only by hydrating apps; the `init`-only bundle contains zero hydrate strings (tree-shaking verified).
    - Always-on cost in an app-shaped bundle (`init`+`component`+`activity`): **+489 B min / +195 B gzip** — the transform tracker + per-window settlement state (`activity.update`), the hydrating-roots registry + widened containment check (`htmlParser`), and the `bootstrap`/`resolveAppRoot` factoring.
    - `init`-only bundle delta: +38 B min / +17 B gzip (the bootstrap factoring alone).
    - Sync-path allocation check: transform-less updates never reach the tracker; sync transform returns exit on bare `typeof` checks — no allocation.
