# Design — core-api-follow-ups

## Context

Three independent fixes in `@loom-js/core`, all surfaced by the `scrub-core-readme` audit and deferred out of that docs-only change. Current state:

- `mount(root, node, append)` (`src/lib/mount.ts`) switches on `append: Boolean | null` — `null` → `replaceChildren`, `false` → `prepend`, anything else → `append`. `init` forwards `AppInitProps.append` verbatim; `hydrate` and the server renders hard-code `null`; `resolveAppRoot` passes `false` to prepend the `#loom-app` fallback div.
- `createRoutes`' options type declares `guard?: (routeValue: RouteValue) => boolean` (`src/router.ts:431`) but the destructuring never binds it; the route table holds only `fallback` and `routesConfig`. The match transform (`Router.transform`) is the single funnel every navigation passes through after `matchRoute` + `validateRoute`.
- `lazyImport`'s cache-hit branch returns `cache.get(key) as ReturnType<typeof activity>`, which instantiates `activity`'s generics at their constraints — so the function's inferred return type is a union whose `effect`/`watch`/`value` members expose `unknown`, and consumers must narrow. `importLazy` carries a `@TODO Determine why I created this & if its still needed.`

## Goals / Non-Goals

**Goals:**

- Self-documenting mount placement on `init` and the internal mount seam.
- A working route guard with minimal, predictable semantics that fit the existing two-layer pipeline.
- Typed `lazyImport` values on both cache paths, with the README workaround removed.

**Non-Goals:**

- No deprecation shim for `append` (pre-1.0; no known consumers — see Decision 1).
- No async guards, per-route guards, or guard-driven redirect orchestration — the single table-level sync guard matches the declared signature; richer routing policy is future work.
- No behavior change to `lazyImport` at runtime; typing only.
- No broader README restructuring — only the three touched sections.

## Decisions

1. **`placement: 'replace' | 'append' | 'prepend'`, hard replacement.** A string-literal union over an enum: TS enums emit runtime objects and tree-shake poorly against core's zero-dependency, zero-runtime-cost ethos, while a union is types-only and reads at the call site. Hard replacement over a deprecation shim: core is 0.6.0, the pre-1.0 convention ships breaking changes as minor changesets, and the only in-repo `append` reference is commented out (`apps/loom/src/app/bootstrap.ts:63` — update the comment while there). `mount`'s third parameter becomes `placement: Placement = 'replace'`, and the internal callers translate: `hydrate`/server mounts pass nothing (replace), `resolveAppRoot` passes `'prepend'`.
2. **Guard lives in the route table and runs in `Router.transform`.** `createRoutes` captures `guard` alongside `fallback`/`routesConfig` (same last-call-wins replacement semantics). In `transform`, after `matchRoute` + `validateRoute` succeed, build the candidate `RouteValue` and call the guard with it; on `false`, return without `update` — exactly the shape of the existing unmatched-route skip, so route subscribers don't fire, the page-import activity keeps its current content (the seeded fallback on first load), and the raw location layer is untouched (it already fired upstream). Alternatives considered: guard before `matchRoute` (can't see `params`/`matchedRoute`, less useful), guard in `pageRouteEffect` (route watchers would still fire — leaks the suppressed navigation), per-route guards (bigger API than the declared signature; future work).
3. **Guarded-out navigations still move the URL.** `route()` pushes history before the transform runs; the guard suppresses content, not the address bar. This is the cheapest coherent semantics for a sync table-level guard — an auth flow calls `redirect('/login')` inside the guard, which replace-states over the suppressed entry. Documented explicitly, including that redirect-loop avoidance is caller-owned (the guard must pass the redirect target).
4. **`LazyImportActivity<ImportType>` via an instantiation expression.** `type LazyImportActivity<ImportType> = ReturnType<typeof activity<ImportType | undefined, () => Promise<ImportType>>>` — declared as `lazyImport`'s explicit return type and used as the cache-hit cast, so both branches converge on the same concrete instantiation (prototype validated against the workspace TS 7). Export the alias from `lazy-import.ts` (it names a public return type — the type surface should carry it). Alternative considered: a typed `Map<string | Symbol, LazyImportActivity<unknown>>` cache — still needs the per-key cast, adds nothing.
5. **`importLazy` resolves its `@TODO` by contract, not removal.** It stays (public export, removal is its own breaking change) and is typed as `LazyImportActivity<ContextFunction | undefined>` — the annotation the underlying `lazyImport<ContextFunction | undefined>` call already produces. The README documents it as the renderable-content convenience, unchanged.
6. **TDD per the repo workflow.** Each item gets failing specs first in `packages/core/tests/`: mount placement modes, guard suppression/pass-through (browser tests via the existing router harness), and a type-level check for `lazyImport` (compile-time assertion in the tests tree, which `type-check-tests` covers).

## Risks / Trade-offs

- [Guarded navigation leaves the URL on a suppressed route (stale-looking address bar if the guard doesn't redirect)] → documented semantics + the auth idiom (`redirect` inside the guard); acceptable for a sync table-level guard, revisit if per-route guards land.
- [`placement` rename breaks unknown external 0.6.0 consumers] → minor changeset with a clear migration line (`append: true` → `placement: 'append'`, `append: false` → `placement: 'prepend'`); pre-1.0 convention accepts this.
- [Instantiation-expression typing (`typeof activity<…>`) regresses under a future TS major] → it's four years stable (TS 4.7+) and the tests tree carries a compile-time assertion that would catch a regression at CI.
- [Guard called on every navigation could surprise with cost] → it's a sync predicate on an already-synchronous transform path; documented as such.

## Migration Plan

Single release: one minor changeset for `@loom-js/core` covering all three items. Consumers of `append` migrate mechanically (`true` → `'append'`, `false` → `'prepend'`, `null`/omitted → omit). No data or runtime migration.

## Open Questions

- None blocking. Per-route guards and async guards are noted as future work, not designed here.
