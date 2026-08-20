## 0. Decisions to confirm at apply start

- [x] 0.1 Settle the async-route-content policy (design "Open question") — leaning `renderToStringAsync` — and record the decision in design.md before section 4.

## 1. Unified pipeline in core

- [x] 1.1 Layer `Router` internals: raw location activity (preserves `force` fire-on-every-update) → match transform → route activity; single `popstate` listener and single `didRouteChange` per instance.
- [x] 1.2 Window-keyed registry: `WeakMap<DomWindow, Router>` resolved via `getWindow()`; construction and wiring are DOM-lazy (first effect/watch/route call inside a DOM scope).
- [x] 1.3 `createRoutes` DOM-free capture: module-level table store (app-global, last-call-wins documented); routers read the store at transform time; returned routes component unchanged in shape.

## 2. Public API & bridge

- [x] 2.1 Export `locationEffect` + `watchLocation` (+ types) from the package index.
- [x] 2.2 Rewrite `routing.ts` as pure delegations (`router` → `locationEffect`, `onRoute` → `route`, `onRouteUpdate` → `watchLocation`) with `@deprecated` JSDoc naming each replacement.

## 3. Consumer migration & docs

- [x] 3.1 Keep `routing.spec.ts` exercising the deprecated names as the bridge-parity guard; migrate `lazy-import.spec.ts` and `tests/support/components/router.ts` to the new API; add browser specs for `locationEffect`/`watchLocation`.
- [x] 3.2 Migrate the server tests (`render-to-string.test.mjs`, `ssg-smoke.test.mjs`) off deprecated `router` onto `locationEffect`.
- [x] 3.3 Rewrite the README Routing section around `createRoutes`/`route`/`routeEffect`/`watchRoute` + the layer-1 API; mark the deprecated names with migrations. Update `.claude/skills/skill-config.md` routing rows.

## 4. Route-aware SSR

- [x] 4.1 Server-lane tests: module-scope `createRoutes` app imports off-browser without throwing; router matches `renderToString`'s `url` (observable via `watchRoute`); two windows/urls resolve independent routers and routes.
- [x] 4.2 Implement the settled async-content policy from 0.1 (e.g. `renderToStringAsync`) + tests serializing a lazily-imported page.

## 5. Verification & release

- [x] 5.1 Full verification: existing `routing.spec`/`route-activation`/`lazy-import` and the whole wtr suite pass unchanged; server lane green; `type-check` + `type-check-tests` clean; `format:check` clean.
- [x] 5.2 Changeset (minor): additive `locationEffect`/`watchLocation` (+ async render entry if adopted), deprecation notices with migrations, module-scope `createRoutes` SSR fix.

## 6. Post-review revision: drop the bridge (user call, 2026-08-15 — see design D5)

The bridge phase (2.2, the `routing.spec.ts` parity guard in 3.1, deprecation docs in 3.3/5.2) was implemented and verified as written above, then removed: pre-1.0 semver plus zero external consumers made the migration window pointless.

- [x] 6.1 Delete `src/routing.ts` & its `index.ts` export; scrub the `@deprecated`-replacement mentions from `router.ts` JSDoc.
- [x] 6.2 Delete `routing.spec.ts` (bridge-parity guard, purpose gone); drop the delegation-identity spec from `location.spec.ts` — its layer-separation coverage stays.
- [x] 6.3 Update the `spa-routing` spec delta (delegation scenarios → removal scenario), proposal, design D5/D6/verification, README (deprecation table removed), `skill-config.md`, and the changeset (deprecations → breaking removal).
- [x] 6.4 Re-verify: full wtr suite, server lane, `type-check` + `type-check-tests`, `format:check`.

## 7. Post-review revision: async-default naming (user call, 2026-08-15 — see design "Resolved question")

The async render is the go-to and nothing had been published yet, so the async entry took the unmarked name before first release.

- [x] 7.1 Rename in `server.ts`: `renderToStringAsync` → `renderToString` (async, go-to), prior sync `renderToString` → `renderToStringSync`; JSDoc & `lib/dom.ts` comment updated.
- [x] 7.2 Update server tests: sync suites onto `renderToStringSync`; `ssg-smoke` & route-content tests onto the async `renderToString`; packaging test asserts both exports.
- [x] 7.3 Update README SSR section, `skill-config.md`, both pending changesets (`add-server-rendering` amended — same unreleased version), the `server-rendering` spec delta (MODIFIED requirement naming both entries), proposal & design notes.
- [x] 7.4 Re-verify: server lane, wtr suite, `type-check` + `type-check-tests`, `format:check`.

## 8. Deferred (tracked, not tasks)

- Successor change `file-based-routes`: build-time folder traversal of `pages/` (`[param]/` → `:param`) emitting literal `import()` routes — one source feeding `createRoutes`, `esbuild-plugin-html-split`, and the SSG page list.
