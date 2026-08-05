<!-- STATUS: EXPLORATORY STUB. Sequence sketch for phase 1; refine before /opsx:apply. -->

## 0. Prerequisites & decisions

- [ ] 0.1 Land `restore-core-green-baseline` first (clean type-check/test baseline).
- [ ] 0.2 Resolve open questions: provider mechanism (explicit param vs AsyncLocalStorage), "workers" scope (edge vs browser Web Workers), SSR routing story.

## 1. Fidelity spike (de-risk before building)

- [ ] 1.1 Prototype: render a representative loom component tree against a **linkedom** document; serialize `innerHTML`. Confirm `createTreeWalker` (+ filters), `DocumentFragment`, and `customElements.define` behave as loom needs.
- [ ] 1.2 If linkedom has gaps, evaluate happy-dom and/or targeted shims; record the decision.

## 2. Provider seam in core

- [ ] 2.1 Define a DOM provider shape exposing `document`, `location`, and the constructors loom `instanceof`-checks (`HTMLElement`, `SVGElement`, `Text`, `Comment`, `Node`, `DocumentFragment`, `NodeFilter`, `customElements`).
- [ ] 2.2 Thread the provider (render-scoped) through the DOM-touching modules: `html-parser.ts`, `lib/mount.ts`, `lib/templating/*`, `lib/context/life-cycles.ts`, `lib/templating/register-custom-element.ts`, `config.ts`.
- [ ] 2.3 Default the provider to the real `window` in the browser with zero added indirection cost; benchmark the client path for regressions.

## 3. Server entry

- [ ] 3.1 Add `renderToString(app, { window })` (e.g. `src/server.ts`) that renders against an injected linkedom document and returns serialized HTML.
- [ ] 3.2 Define server-safe lifecycle semantics (mount hooks no-op/queued; connectivity checks vs injected document).
- [ ] 3.3 Add `linkedom` as an optional/peer dep of the server entry; keep it out of the browser bundle.

## 4. Routing under SSR (may split to a follow-up)

- [ ] 4.1 Provide a request-URL path into `router`/`onRoute` without `window.location` (inject a `location`-like via the provider).

## 5. Tests & docs

- [ ] 5.1 Tests: `renderToString` output; per-render isolation (concurrent renders); browser path unchanged; mount effects suppressed on server.
- [ ] 5.2 SSG smoke: prerender the example app to a static HTML file at build time.
- [ ] 5.3 Docs: server-rendering usage; changeset (minor) for `@loom-js/core`.

## 6. Future phases (out of scope here — tracked, not done)

- [ ] 6.1 Phase 2: measure edge/worker footprint & latency; add a string renderer for those runtimes only if warranted.
- [ ] 6.2 Phase 3: hydration — separate proposal; ensure phase-1 output carries the structure/markers it needs.
