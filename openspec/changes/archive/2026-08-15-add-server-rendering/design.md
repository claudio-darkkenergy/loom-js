## Context

loom is DOM-first: the render pipeline parses a template, **builds real DOM nodes**, walks them with `document.createTreeWalker`, and reconciles by `instanceof HTMLElement/SVGElement/Text/...`. ~52 global browser-API references across ~15 `src` files (routing `window.location`/`history`; templating/mount/html-parser/life-cycles `document.*`; `customElements.define`; `NodeFilter`; `window.encodeURIComponent`).

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

- `renderToString(app, { window, url })` → HTML string, outside a browser, via injected linkedom.
- Reuse the client render path; zero SSR/CSR drift.
- Concurrency-safe (per-render window, never a global).
- Zero measurable overhead on the browser hot path (default provider = real globals).
- Importing `@loom-js/core` off-browser must not crash (module-load coupling removed).

**Non-Goals (phase 1):**

- String/DOM-free renderer (phase 2, edge/worker-driven, only if measured need).
- Hydration (later phase; do not preclude it).
- Puppeteer prerender (external tooling).
- Per-request router isolation (the `Router` singleton persists across renders — follow-up).
- Flushing async work (lazy routes, async activity updates) into the serialized output — phase 1 serializes what renders synchronously.

## Decisions

### D1: Per-render window, NOT a global (`config.win` is obsolete)

```
 Global config.win under concurrent SSR:
   Req A → config.win = domA ┐
   Req B → config.win = domB ┴→ 💥 B clobbers A mid-render → corrupted HTML

 Chosen: window is a render-scoped parameter →  renderToString(app, { window: domA })
```

Public API is the explicit param. **Internally**, the seam is `lib/dom.ts`:

```ts
getWindow() / getDocument(); // resolve the current provider (default: real window)
withWindow(win, fn); // swap → run fn → restore, synchronously
```

loom's render pass is fully synchronous, so a synchronous swap-and-restore is
observationally identical to threading the provider as an argument — and Node
interleaves concurrent requests only at `await` points, so two overlapping
`renderToString` calls can never see each other's window. This avoids invasive
threading through `htmlParser` (bound to component contexts) and the templating
internals. AsyncLocalStorage rejected: Node-only, and unnecessary given the
synchronous scope. **Corollary:** anything async that settles after
`renderToString` returns is outside the render scope and is not serialized.

### D2: Resolve DOM access through the provider, defaulting to real globals

Replace direct `window.*` / `document.*` / bare `instanceof HTMLElement` with access through `getWindow()`/`getDocument()`, which in the browser return the real `window` (an accessor call — no measurable client cost). The provider surface loom needs: `document`, `location`, `history`, `customElements`, `HTMLElement`, `SVGElement`, `Text`, `Comment`, `Node`, `NodeList`, `Element`, `DocumentFragment`, `NodeFilter`, `MutationObserver`, `addEventListener`, `Event`.

- `instanceof` consistency: linkedom's DOM classes are **module-level** (shared across `parseHTML` calls — spike-verified), so nodes cloned from the template cache in one render satisfy `instanceof getWindow().HTMLElement` in another render's window. Cross-realm breakage cannot occur within a single linkedom module instance.

### D3: linkedom as the phase-1 DOM impl — caller-supplied, dep-free

- **Why linkedom over happy-dom/jsdom:** small, fast, pure-JS (closest to edge-compatible), purpose-built for SSR serialize. jsdom is heavy/Node-only; happy-dom was the fallback — **not needed** (see spike results).
- **Dependency shape:** core never imports linkedom. The caller builds the window (`parseHTML(...)`) and passes it in. No peer dep, nothing in the browser bundle; linkedom is a core devDependency for tests only.

### D4: Server-safe lifecycle semantics

- `_lifeCycles.observe` (MutationObserver + `mounted` dispatch) is only called from the browser `init()` bootstrap. `renderToString` mounts without observing → `onMounted`/`onUnmounted` handlers never fire server-side. `created`/`beforeRender`/`rendered` fire as normal (they are render-phase hooks).
- Connectivity checks (`document.contains`) resolve against the injected document via `getDocument()`.
- The module-level `lifeCycleNodes` registry (Map keyed by root node) would grow per SSR request; `renderToString` releases entries belonging to its render's document in a `finally` (new internal `_lifeCycles.release(document)`).

### D5: Module-load coupling must go (import-safety)

Three modules crash on bare import outside a browser; a `./server` entry alone can't dodge this because app code imports `@loom-js/core` and SSR imports the app:

- `config.ts:95` — `window.encodeURIComponent` during token-regex setup → bare `encodeURIComponent` (a realm-independent standard global).
- `routing.ts:7,11` — module-scope `activity(window.location)` + `popstate` listener → lazily initialized on first use, resolving through the provider.
- `router.ts:251` — module-scope `new Router()` whose constructor reads `window.location` → lazy singleton, provider-resolved location.

### D6: Server entry normalizes the injected window (spike findings, 2026-08-14)

linkedom `parseHTML` windows verified good: `createRange().createContextualFragment`, `createTreeWalker` (incl. numeric `whatToShow` and correct `walker.root`), deep `cloneNode`, `customElements.define` + upgrade-on-insert (`connectedCallback` fires), `document.contains`, `innerHTML`/`toString` serialization, `replaceWith`/`insertBefore`/`isSameNode`, `NodeList` instances, `MutationObserver` construction, SVG `instanceof`, **parsed attribute order preserved** (the order `getPaths` maps interpolation indices by), `Attr.value`/`.name`/`.nodeName` all correct.

Gaps, all normalized by `renderToString` on the injected window (spike-verified assignable):

- `window.NodeFilter` missing → install (`{ SHOW_ALL: 0xffffffff, SHOW_ELEMENT: 0x1 }` — linkedom's TreeWalker accepts numeric `whatToShow`).
- `window.location` missing → install a **plain-object** location-like built from the `url` option (own enumerable fields — a raw `URL` instance fails `Object.assign({}, location)` snapshots the router takes, because URL fields are prototype getters).
- `window.history` missing → install a minimal `pushState`/`replaceState` shim that updates the location-like (server redirects/navigation don't re-render in phase 1).
- `Attr.nodeValue` is `null` in linkedom → one-line core fix: `register-custom-element.ts` reads `attr.name`/`attr.value` via `Array.from(this.attributes)` instead of `Object.values(...)`/`attr.nodeValue` (browser-identical; linkedom's `NamedNodeMap` leaks an `ownerElement` key through `Object.values`).
- **Cross-document custom-element upgrades** (found during implementation): `cloneNode(true)` of a cached template fragment from render A's document never upgrades custom elements when inserted into render B's document — linkedom only fires `connectedCallback` for elements built against the inserting document. Fix in `htmlParser`: re-clone via `getDocument().importNode(fragment, true)` instead of `cloneNode` (equivalent in the browser's single-document world; benchmark-verified no client cost).

### D7: Serialization boundary

`renderToString` mounts the app's context root into `window.document.body` (replace-children semantics, same as browser `mount`) and returns `document.body.innerHTML`. Callers wanting a full document parse their own HTML shell into `parseHTML` and serialize `document.toString()` themselves — the string return stays the app markup.

## Risks / Trade-offs

- **Shared-core churn** → provider threaded through the render hot path. Mitigate: default to real globals (accessor pass-through), full existing wtr suite must stay green; watch for timing regressions.
- **Template cache realm-mixing** → resolved: linkedom classes are shared across windows (spike), and cached fragments are only ever cloned, never mutated post-creation.
- **Routing under SSR** → phase 1 ships import-safety + request-URL flow; the router singleton's cross-render state is a documented follow-up.
- **Hydration pull** → phase 1 output is the real element tree rendered through client code, which is the structure hydration needs; markers deferred to the hydration proposal.

## Phasing

```
 Phase 1  linkedom seam + renderToString (per-render window)
          → SSR (Node) + SSG/build-time prerender. Max fidelity, min new code.
 Phase 2  measure edge/worker footprint & latency; IF needed →
          → string renderer for those runtimes only (accept 2nd path + drift tax).
 Phase 3  hydration (server HTML → interactive). Separate design. Deferred.
```
