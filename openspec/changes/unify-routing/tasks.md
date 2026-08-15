## 0. Decisions to confirm at apply start

- [ ] 0.1 Settle the async-route-content policy (design "Open question") — leaning `renderToStringAsync` — and record the decision in design.md before section 4.

## 1. Unified pipeline in core

- [ ] 1.1 Layer `Router` internals: raw location activity (preserves `force` fire-on-every-update) → match transform → route activity; single `popstate` listener and single `didRouteChange` per instance.
- [ ] 1.2 Window-keyed registry: `WeakMap<DomWindow, Router>` resolved via `getWindow()`; construction and wiring are DOM-lazy (first effect/watch/route call inside a DOM scope).
- [ ] 1.3 `createRoutes` DOM-free capture: module-level table store (app-global, last-call-wins documented); routers read the store at transform time; returned routes component unchanged in shape.

## 2. Public API & bridge

- [ ] 2.1 Export `locationEffect` + `watchLocation` (+ types) from the package index.
- [ ] 2.2 Rewrite `routing.ts` as pure delegations (`router` → `locationEffect`, `onRoute` → `route`, `onRouteUpdate` → `watchLocation`) with `@deprecated` JSDoc naming each replacement.

## 3. Consumer migration & docs

- [ ] 3.1 Keep `routing.spec.ts` exercising the deprecated names as the bridge-parity guard; migrate `lazy-import.spec.ts` and `tests/support/components/router.ts` to the new API; add browser specs for `locationEffect`/`watchLocation`.
- [ ] 3.2 Migrate the server tests (`render-to-string.test.mjs`, `ssg-smoke.test.mjs`) off deprecated `router` onto `locationEffect`.
- [ ] 3.3 Rewrite the README Routing section around `createRoutes`/`route`/`routeEffect`/`watchRoute` + the layer-1 API; mark the deprecated names with migrations. Update `.claude/skills/skill-config.md` routing rows.

## 4. Route-aware SSR

- [ ] 4.1 Server-lane tests: module-scope `createRoutes` app imports off-browser without throwing; router matches `renderToString`'s `url` (observable via `watchRoute`); two windows/urls resolve independent routers and routes.
- [ ] 4.2 Implement the settled async-content policy from 0.1 (e.g. `renderToStringAsync`) + tests serializing a lazily-imported page.

## 5. Verification & release

- [ ] 5.1 Full verification: existing `routing.spec`/`route-activation`/`lazy-import` and the whole wtr suite pass unchanged; server lane green; `type-check` + `type-check-tests` clean; `format:check` clean.
- [ ] 5.2 Changeset (minor): additive `locationEffect`/`watchLocation` (+ async render entry if adopted), deprecation notices with migrations, module-scope `createRoutes` SSR fix.

## 6. Deferred (tracked, not tasks)

- Delete `routing.ts` next release (one-liner once the bridge has had a migration window).
- Successor change `file-based-routes`: build-time folder traversal of `pages/` (`[param]/` → `:param`) emitting literal `import()` routes — one source feeding `createRoutes`, `esbuild-plugin-html-split`, and the SSG page list.
