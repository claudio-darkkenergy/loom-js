# Core API Follow-ups from the README Scrub

## Why

The `scrub-core-readme` audit surfaced three source-level warts the docs could only describe, not fix (its design forbade smuggling code changes into a docs pass): `init`'s mount position rides an unreadable three-valued `append?: boolean | null` (`null` = replace, `true` = append, `false` = prepend); `createRoutes` declares a `guard` option its implementation has never read (dead since its introduction in `99ff684`); and `lazyImport`'s cache-hit branch returns an untyped `ReturnType<typeof activity>` union that forces every consumer into `typeof`-narrowing — the README's own example had to carry the workaround.

## What Changes

- **BREAKING** Replace `AppInitProps.append` with `placement?: 'replace' | 'append' | 'prepend'` (default `'replace'`) — a string-literal union, not an enum (unions are zero-runtime-cost & self-documenting at the call site). The internal `mount()` third parameter takes the same union. Hard replacement, no deprecation shim: core is 0.6.0 (pre-1.0 convention: breaking changes ship as minor changesets) and the only in-repo `append` reference is a commented-out line in `apps/loom`.
- **Implement `createRoutes`' `guard`**: `guard?: (routeValue: RouteValue) => boolean` moves into the route table alongside `fallback` and runs in the router's match transform after a valid match, receiving the candidate `RouteValue`. Returning `false` suppresses the route emission — route subscribers don't fire and page content stays put (fallback on first load) — while the raw location layer (layer 1) still fires. Auth-style flows call `redirect()` inside the guard; redirect-loop avoidance is caller-owned.
- **Fix `lazyImport`'s return type**: declare `LazyImportActivity<ImportType>` = `ReturnType<typeof activity<ImportType | undefined, () => Promise<ImportType>>>` as the function's return type and pin the cache-hit cast to it (validated against the workspace TS 7). Resolve the adjacent `@TODO` on `importLazy` by typing it as `LazyImportActivity<ContextFunction | undefined>`… i.e. the same instantiation `lazyImport<ContextFunction | undefined>` already produces.
- **README updates** for all three: document `placement`, document `guard` in the Routing section, and drop the `typeof Chart === 'function'` narrowing workaround from the lazy-import example now that the value flows typed.

## Capabilities

### New Capabilities

- `app-mount-placement`: the boot mount position is expressed as a self-documenting placement mode — `'replace' | 'append' | 'prepend'` — with `'replace'` as the default, on both `init`'s public contract and the internal mount seam.

### Modified Capabilities

- `spa-routing`: adds the route-guard requirement — a registered guard runs on every valid route match and a `false` verdict suppresses the route emission without silencing the raw location layer.
- `core-type-surface`: adds the typed lazy-import requirement — `lazyImport` returns the concrete activity instantiation for its `ImportType` on both cache paths, so consumers get typed values without narrowing; retires the `importLazy` `@TODO` by contract.

## Impact

- `packages/core/src/types.ts` (`AppInitProps`), `src/app.ts`, `src/hydrate.ts` (passes through to mount), `src/lib/mount.ts`, `src/lib/bootstrap.ts` (`resolveAppRoot`'s prepend), `src/server.ts` (mount call) — placement union.
- `packages/core/src/router.ts` — route table + match transform read the guard.
- `packages/core/src/lazy-import.ts` — return typing; no runtime behavior change.
- `packages/core/README.md` — Bootstrapping, Routing, and Lazy imports sections.
- `packages/core/tests/**` — new/updated specs per TDD workflow.
- One minor changeset for `@loom-js/core` (breaking pre-1.0).
