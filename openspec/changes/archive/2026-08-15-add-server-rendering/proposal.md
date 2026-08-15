## Why

`@loom-js/core` renders only in a live browser: it builds **real DOM nodes** and reconciles by `instanceof` against them (`document.createTreeWalker`, `createDocumentFragment`, `customElements.define`, `instanceof HTMLElement`, etc. across ~15 files). This blocks server-side rendering (SSR), static site generation (SSG), and build-time prerendering — so loom apps ship a blank shell until JS boots (poor first paint, no HTML for crawlers/no-JS, no ISR/edge delivery).

We want loom to render HTML **outside a browser** without forking its rendering logic. The framework's "build-real-nodes-then-reconcile" model makes an **injectable DOM provider** the natural, low-friction seam: on a server/build, point loom at a lightweight JS DOM implementation (**linkedom**), render through the _exact same_ code path, and serialize `innerHTML`. This reuses reconciliation, custom elements, and lifecycle with **zero CSR/SSR drift**.

Note: the legacy `config.win = window` idea (from the deleted `tests/index.ts`) was directionally right but **obsolete in shape** — a mutable module global that breaks under concurrent requests. The seam here is **per-render**, not global.

## What Changes

- **Introduce a per-render DOM provider seam** (`src/lib/dom.ts`). Rendering resolves `window`/`document` (and the DOM constructors used for `instanceof`: `HTMLElement`, `SVGElement`, `Text`, `Comment`, `DocumentFragment`, `Node`, `NodeList`, `Element`, plus `NodeFilter`, `customElements`) through `getWindow()`/`getDocument()` accessors instead of bare globals. In a browser these resolve to the real `window` (no behavior change). The public server API is an explicit per-render parameter; internally the seam is a synchronous swap-and-restore scope (`withWindow(win, fn)`) — loom's render pass is fully synchronous, so this is concurrency-safe without threading a provider argument through every templating function.
- **Fix module-load browser coupling.** `routing.ts` (module-scope `activity(window.location)` + `popstate` listener), `router.ts` (module-scope `new Router()` reading `window.location`), and `config.ts` (`window.encodeURIComponent` during token-regex setup) all crash on bare import outside a browser. These become lazy/global-free so importing `@loom-js/core` (which every isomorphic app module does) is safe anywhere.
- **Add a server render entry** — `renderToString(app, { window, url })` in a new `./server` export — that renders against an injected linkedom `window` and returns serialized HTML. It normalizes the injected window for linkedom's gaps (installs `NodeFilter`, a plain-object `location`-like built from `url`, and a minimal `history` shim) and releases per-render lifecycle registrations afterward. Concurrency-safe by construction (the window is a parameter, not a global).
- **Server-safe lifecycle semantics:** `_lifeCycles.observe` (MutationObserver + mounted dispatch) is only invoked by the browser `init()` path, so `onMounted` handlers never fire during `renderToString`; connectivity checks (`document.contains`) resolve against the injected document; the module-level lifecycle registry is released per render to prevent cross-request growth.
- **linkedom stays out of core's dependency graph entirely.** The caller supplies the window (`parseHTML` in their server code); core never imports linkedom, so nothing reaches the browser bundle and no peer dependency is needed. linkedom is a devDependency for core's tests only.
- **Deliberately NOT in this change (future phases):**
    - **String renderer** (a second, DOM-free render path) — only if edge/worker footprint or latency later demands it (measure first).
    - **Hydration** (make server HTML interactive client-side) — a separate, larger effort; the seam is designed to not preclude it.
    - **Full SSR routing** — the `Router` singleton persists across renders; per-request router isolation is a follow-up. Phase 1 delivers request-URL flow via the injected window's `location`.
    - **Puppeteer build-time prerender** — optional external tooling, not a framework capability.

## Capabilities

### New Capabilities

- `server-rendering`: Render a loom app to an HTML string outside a browser, via a per-render injectable DOM provider (linkedom), reusing the client render path. Covers SSR (request-time) and SSG/prerender (build-time). Edge/worker delivery and hydration are future extensions of this capability.

## Impact

- **Code:** the DOM boundary across `packages/core/src` — `html-parser.ts`, `config.ts`, `routing.ts`, `router.ts`, `app.ts`, `lib/mount.ts`, `lib/context/helpers.ts`, `lib/context/life-cycles.ts`, `lib/templating/{get-paths, get-text-update, get-live-text-nodes, set-updates-for-paths, resolve-value, register-custom-element}.ts`, `elements/route-link.ts`, plus new `lib/dom.ts` and `server.ts` (new `./server` package export + rollup entry).
- **New dep:** `linkedom` as a core **devDependency** only (tests). Never imported by shipped code.
- **Risk:** touches the shared render core every consumer exercises → broad regression surface, mitigated by the existing wtr suite plus new server tests. Provider indirection is an accessor call returning the real `window` in browsers — no measurable hot-path cost expected; verified against the suite.
- **Release:** `@loom-js/core` minor (additive server entry) via changeset once implemented.
- **Depends on / relates to:** `restore-core-green-baseline` (landed 2026-07-25); independent of the two array-reconciliation changes.

## Resolved Questions

1. **Provider mechanism:** explicit `renderToString(app, { window })` public API; internal render-scoped `withWindow` swap (sync render makes it equivalent to threading, without the churn). No AsyncLocalStorage (Node-only, unneeded).
2. **"Workers" scope:** edge/serverless isolates (Cloudflare-style) — future phase 2 target for a string renderer. Browser Web Workers are out of scope.
3. **Routing under SSR:** request URL flows via the injected window's `location`-like (built from `renderToString`'s `url` option); `Router`/`routing` become lazy so import is safe. Per-request router isolation is a follow-up.
4. **linkedom fidelity:** spiked 2026-08-14 — viable. Gaps (`window.NodeFilter`, `location`, `history` missing; `Attr.nodeValue` null) are normalized by the server entry / one-line core fix. See design.md.
5. **Hydration readiness:** the DOM-lib path renders the real element tree through the client code path, so the output already carries the app's full structure; explicit hydration markers are deferred to the hydration proposal.
