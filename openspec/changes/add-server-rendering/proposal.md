> **STATUS: EXPLORATORY STUB.** Captures direction from an `explore` session. Design decisions are ranked but not final; specs/tasks are intentionally high-level. Not ready for `/opsx:apply` — refine before implementing. Hydration is explicitly a later phase.

## Why

`@loom-js/core` renders only in a live browser: it builds **real DOM nodes** and reconciles by `instanceof` against them (`document.createTreeWalker`, `createDocumentFragment`, `customElements.define`, `instanceof HTMLElement`, etc. across ~12 files). This blocks server-side rendering (SSR), static site generation (SSG), and build-time prerendering — so loom apps ship a blank shell until JS boots (poor first paint, no HTML for crawlers/no-JS, no ISR/edge delivery).

We want loom to render HTML **outside a browser** without forking its rendering logic. The framework's "build-real-nodes-then-reconcile" model makes an **injectable DOM provider** the natural, low-friction seam: on a server/build, point loom at a lightweight JS DOM implementation (**linkedom**), render through the _exact same_ code path, and serialize `innerHTML`. This reuses reconciliation, custom elements, and lifecycle with **zero CSR/SSR drift**.

Note: the legacy `config.win = window` idea (from the deleted `tests/index.ts`) was directionally right but **obsolete in shape** — a mutable module global that breaks under concurrent requests. The seam here is **per-render**, not global.

## What Changes

- **Introduce a per-render DOM provider seam.** Rendering resolves `window`/`document` (and DOM constructors used for `instanceof`: `HTMLElement`, `SVGElement`, `Text`, `Comment`, `DocumentFragment`, `Node`, plus `NodeFilter`, `customElements`) from a **render-scoped** provider rather than reaching for globals. In a browser this defaults to the real `window` (no behavior change).
- **Add a server render entry** (e.g. `renderToString(app, { window })`) that renders against an injected linkedom document and returns serialized HTML. Concurrency-safe by construction (window is a parameter, not a global).
- **Thread the provider through the DOM-touching modules** (`html-parser`, `mount`, `templating/*`, `context/life-cycles`, `register-custom-element`, `config`, and — separately — routing). Lifecycle hooks that assume a live document (`onMounted`, `document.contains`) get server-safe semantics (no-op / deferred to hydration).
- **Ship linkedom as an optional/peer dependency of the server entry** (not pulled into the browser bundle).
- **Deliberately NOT in this change (future phases):**
    - **String renderer** (a second, DOM-free render path) — only if edge/worker footprint or latency later demands it (measure first).
    - **Hydration** (make server HTML interactive client-side) — a separate, larger effort; the seam is designed to not preclude it.
    - **Puppeteer build-time prerender** — optional external tooling, not a framework capability.

## Capabilities

### New Capabilities

- `server-rendering`: Render a loom app to an HTML string outside a browser, via a per-render injectable DOM provider (linkedom), reusing the client render path. Covers SSR (request-time) and SSG/prerender (build-time). Edge/worker delivery and hydration are future extensions of this capability.

## Impact

- **Code:** the DOM boundary across `packages/core/src` — `html-parser.ts`, `lib/mount.ts`, `lib/templating/*`, `lib/context/life-cycles.ts`, `lib/templating/register-custom-element.ts`, `config.ts`, plus a new server entry (e.g. `src/server.ts`). Routing (`router.ts`, `routing.ts`) touches `window.location`/`history` and needs a request-URL story for SSR (likely a follow-up).
- **New dep:** `linkedom` (server entry only; keep out of the browser build).
- **Risk:** touches the shared render core every consumer exercises → broad regression surface. Provider indirection must not slow the browser hot path (default to real globals with zero overhead). linkedom must faithfully implement the DOM APIs loom uses (TreeWalker + filters, DocumentFragment, `customElements.define`) — a fidelity spike is required.
- **Release:** `@loom-js/core` minor (additive server entry) via changeset once implemented.
- **Depends on / relates to:** `restore-core-green-baseline` (clean baseline first); independent of the two array-reconciliation changes.

## Open Questions (to resolve before apply)

1. **Provider mechanism:** explicit per-render param (`renderToString(app, { window })`) vs `AsyncLocalStorage` ambient context. Leaning explicit param (traceable, edge-safe, no Node-only dep).
2. **"Workers" scope:** interpreted here as **edge/serverless workers (Cloudflare-style V8 isolates)** — same family as Edge/ISR, a _future_ target favoring the string renderer. Browser **Web Workers** (off-main-thread client compute) are treated as a separate, out-of-scope concern. Confirm.
3. **Routing under SSR:** how request URL flows into `router`/`onRoute` without `window.location` (inject a `location`-like into the provider?).
4. **linkedom fidelity:** does it cover `createTreeWalker` filters, `DocumentFragment`, and `customElements.define` well enough? Spike before committing.
5. **Hydration readiness:** what markers/structure must the SSR output carry so a later hydration phase can re-attach without re-rendering?
