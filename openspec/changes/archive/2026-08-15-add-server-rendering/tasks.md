## 0. Prerequisites & decisions

- [x] 0.1 Land `restore-core-green-baseline` first (clean type-check/test baseline). _(Archived 2026-07-25.)_
- [x] 0.2 Resolve open questions: provider mechanism (explicit param vs AsyncLocalStorage), "workers" scope (edge vs browser Web Workers), SSR routing story. _(Resolved 2026-08-14 — see proposal "Resolved Questions" + design D1/D5/D6.)_

## 1. Fidelity spike (de-risk before building)

- [x] 1.1 Prototype: render a representative loom component tree against a **linkedom** document; serialize `innerHTML`. Confirm `createTreeWalker` (+ filters), `DocumentFragment`, and `customElements.define` behave as loom needs. _(Primitive-level spike passed 25/33 with all failures explained; full-tree render lands with the tests in 5.1 once the seam exists.)_
- [x] 1.2 If linkedom has gaps, evaluate happy-dom and/or targeted shims; record the decision. _(Gaps are shallow — `NodeFilter`/`location`/`history` absent but installable, `Attr.nodeValue` null; normalized by the server entry + one-line core fix. happy-dom not needed. Recorded in design D6.)_

## 2. Provider seam in core

- [x] 2.1 Add `lib/dom.ts`: `getWindow()`/`getDocument()` accessors defaulting to the real `window`, plus render-scoped `withWindow(win, fn)` swap-and-restore.
- [x] 2.2 Thread the accessors through the DOM-touching modules (`html-parser.ts`, `lib/mount.ts`, `lib/templating/*`, `lib/context/helpers.ts`, `lib/context/life-cycles.ts`, `app.ts`, `elements/route-link.ts`) and remove module-load browser coupling (`config.ts` bare `encodeURIComponent`; lazy `routing.ts` activity; lazy `router.ts` singleton). Switch `register-custom-element.ts` to `Array.from(attributes)` + `attr.name`/`attr.value`.
- [x] 2.3 Verify the browser path: existing wtr suite green, `type-check` + `type-check-tests` clean, no measurable render-time regression.

## 3. Server entry

- [x] 3.1 Add `src/server.ts` with `renderToString(app, { window, url })`: normalize the injected window (design D6), render via `withWindow`, mount into `document.body`, return `body.innerHTML`.
- [x] 3.2 Server lifecycle semantics: no `observe` call (mount hooks stay silent), release per-render `lifeCycleNodes` entries in a `finally` (`_lifeCycles.release(document)`).
- [x] 3.3 Package the entry: `./server` export in `package.json` + rollup entry (+ dts); linkedom stays devDependency-only, out of the browser bundle.

## 4. Routing under SSR (minimal phase-1 slice)

- [x] 4.1 Request-URL flow: `router`/`routing` resolve `location`/`history` through the provider so the injected window's `location`-like drives route matching; full per-request router isolation stays a follow-up.

## 5. Tests & docs

- [x] 5.1 Tests: `renderToString` output (representative component tree incl. attrs, arrays, nested components); per-render isolation (two windows, no cross-contamination); mount effects suppressed on server; existing browser suite unchanged.
- [x] 5.2 SSG smoke: prerender a small example app to a static HTML file via a Node script. _(`tests/server/ssg-smoke.test.mjs` — two-page app, full HTML shells, one window per page; runs in the `test-server` lane.)_
- [x] 5.3 Docs: server-rendering section in `packages/core/README.md`; changeset (minor) for `@loom-js/core` (`.changeset/add-server-rendering.md`).

## 6. Future phases (out of scope — tracked in proposal "What Changes", not as tasks)

- Phase 2: measure edge/worker footprint & latency; add a string renderer for those runtimes only if warranted.
- Phase 3: hydration — separate proposal; phase-1 output already carries the rendered element structure it needs.
