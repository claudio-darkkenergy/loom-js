---
'@loom-js/core': minor
---

Core API follow-ups from the README scrub:

- **BREAKING**: `init`'s `append?: boolean | null` prop is replaced by `placement?: 'replace' | 'append' | 'prepend'` (default `'replace'`). Migrate mechanically: `append: true` → `placement: 'append'`, `append: false` → `placement: 'prepend'`, `append: null`/omitted → omit.
- `createRoutes`' previously-declared-but-dead `guard` option now works: `guard?: (routeValue: RouteValue) => boolean` runs on every valid route match with the candidate `RouteValue`; returning `false` suppresses the route emission (route effects & watchers stay silent, page content stays put) while the raw location layer still fires and the URL keeps the navigation — auth flows call `redirect()` inside the guard.
- `lazyImport` now returns the typed `LazyImportActivity<ImportType>` (exported) on both cache paths, so `effect`/`watch`/`value()` carry `ImportType | undefined` without narrowing; `importLazy` is typed as `LazyImportActivity<ContextFunction | undefined>`.
