> **STATUS: EXPLORATORY STUB** — captures direction and tradeoffs from an `explore` session. Decisions are ranked, not locked.

## Context

loom is DOM-first: the render pipeline parses a template, **builds real DOM nodes**, walks them with `document.createTreeWalker`, and reconciles by `instanceof HTMLElement/SVGElement/Text/...`. ~90 global browser-API references across ~12 `src` files (routing `window.location`/`history`; templating/mount/html-parser/life-cycles `document.*`; `customElements.define`; `NodeFilter`; `window.encodeURIComponent`).

Because rendering already produces real nodes, the cheapest path to server rendering is to **swap the source of the DOM**, not to write a new renderer. That is the injectable-DOM-provider seam.

## Three strategies considered

```
 (1) Real browser (Puppeteer)   (2) Server DOM lib (linkedom)   (3) String renderer
     run actual bundle,             framework builds nodes vs        walk template AST →
     snapshot HTML                  a JS DOM impl, serialize         emit HTML string,
                                    innerHTML                        never build a node
     build-time only,           →  server / build / (edge?)      →  edge / workers / anywhere
     max fidelity, heavy            reuse client code, hi-fidelity    fastest, tiny, but a 2nd
                                                                      renderer to maintain
```

**Chosen for phase 1: Strategy 2 (linkedom).** It reuses loom's exact render + reconciliation code (zero CSR/SSR drift), fits the architecture's grain, and is the smallest new surface. Strategy 3 fights the "build real nodes" model (parallel renderer, drift tax) and is deferred to an edge/worker-driven future phase. Strategy 1 (Puppeteer) stays optional external build-time tooling.

## Goals / Non-Goals

**Goals (phase 1):**

- `renderToString(app, { window })` → HTML string, outside a browser, via injected linkedom.
- Reuse the client render path; zero SSR/CSR drift.
- Concurrency-safe (per-render window, never a global).
- Zero measurable overhead on the browser hot path (default provider = real globals).

**Non-Goals (phase 1):**

- String/DOM-free renderer (phase 2, edge/worker-driven, only if measured need).
- Hydration (later phase; do not preclude it).
- Puppeteer prerender (external tooling).
- Full SSR routing (request-URL story likely a follow-up).

## Decisions

### D1: Per-render window, NOT a global (`config.win` is obsolete)

```
 Global config.win under concurrent SSR:
   Req A → config.win = domA ┐
   Req B → config.win = domB ┴→ 💥 B clobbers A mid-render → corrupted HTML

 Chosen: window is a render-scoped parameter →  render(App(), { window: domA })
```

- **Leaning:** explicit `renderToString(app, { window })` param over `AsyncLocalStorage` — traceable, edge-safe, no Node-only dependency. AsyncLocalStorage reconsidered only if threading the provider proves too invasive.

### D2: Resolve DOM access through a provider, defaulting to real globals

Replace direct `window.*` / `document.*` / `new Text()` / `instanceof HTMLElement` with access through a provider object that, in the browser, _is_ the real `window` (so the client path is unchanged and un-slowed). The provider must expose everything loom type-checks against: `HTMLElement`, `SVGElement`, `Text`, `Comment`, `Node`, `DocumentFragment`, `NodeFilter`, `customElements`, plus `document` and `location`.

- **Risk:** `instanceof` checks are the subtle part — a node created by linkedom must satisfy `instanceof provider.HTMLElement` for the _same_ provider. Keeping one provider per render makes this consistent.

### D3: linkedom as the phase-1 DOM impl (server entry only)

- **Why linkedom over happy-dom/jsdom:** small, fast, pure-JS (closest to edge-compatible), purpose-built for SSR serialize. jsdom is heavy/Node-only; happy-dom is a fallback if linkedom fidelity gaps appear.
- **Required spike:** verify `createTreeWalker` + filters, `DocumentFragment`, and `customElements.define` fidelity against loom's usage before committing.

### D4: Server-safe lifecycle semantics

`onMounted` / `document.contains(root)` assume a live, connected document. On the server: mount hooks are no-ops (or queued as hydration work), and connectivity checks resolve against the injected document. Define this explicitly so SSR doesn't fire client-only effects.

## Risks / Trade-offs

- **Shared-core churn** → provider threaded through the render hot path. Mitigate: default to real globals (identity pass-through), benchmark the browser path for regressions.
- **linkedom fidelity gaps** (TreeWalker/customElements) → spike first; happy-dom fallback; worst case, targeted shims.
- **Routing under SSR** → `window.location`/`history` have no server equivalent; inject a `location`-like via the provider and pass request URL in. Likely a follow-up change.
- **Hydration pull** → phase 1 output should carry enough structure/markers for a later hydration phase to re-attach; the DOM-lib path favors this (real element tree, not opaque string).

## Phasing

```
 Phase 1  linkedom seam + renderToString (per-render window)
          → SSR (Node) + SSG/build-time prerender. Max fidelity, min new code.
 Phase 2  measure edge/worker footprint & latency; IF needed →
          → string renderer for those runtimes only (accept 2nd path + drift tax).
 Phase 3  hydration (server HTML → interactive). Separate design. Deferred.
```

## Open Questions

(See proposal — provider mechanism, "workers" = edge vs browser Web Workers, SSR routing, linkedom fidelity spike, hydration markers.)
