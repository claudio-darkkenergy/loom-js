# Tasks — core-api-follow-ups

## 1. Mount placement

- [ ] 1.1 Write failing specs for the three placement modes (`replace` default, `append`, `prepend`) against `init` in `packages/core/tests/`
- [ ] 1.2 Add the `Placement` union to `types.ts`, replace `AppInitProps.append` with `placement?`, and thread it through `app.ts` → `lib/mount.ts` (switching `mount`'s third param to the union, default `'replace'`)
- [ ] 1.3 Update internal callers: `resolveAppRoot` passes `'prepend'`; `hydrate`/server mounts rely on the default; update the commented-out `append` line in `apps/loom/src/app/bootstrap.ts`
- [ ] 1.4 Update the README Bootstrapping section (`placement` prop docs replace the `append` bullet)

## 2. Route guard

- [ ] 2.1 Write failing router specs: guard passes, guard suppresses (route effects/watchers silent, content unchanged), location layer still fires on suppression, guard receives the candidate `RouteValue`, no-guard behavior unchanged
- [ ] 2.2 Capture `guard` into the route table in `createRoutes` (last call wins) and invoke it in `Router.transform` after a valid match, returning without `update` on `false`
- [ ] 2.3 Document `guard` in the README Routing section, including the URL-moves-anyway semantics and the `redirect`-inside-guard auth idiom (loop avoidance caller-owned)

## 3. lazyImport typing

- [ ] 3.1 Add a compile-time assertion spec in `packages/core/tests/` (covered by `type-check-tests`): `lazyImport<Component>` values flow as `Component | undefined` on both cache paths; `importLazy` presents `LazyImportActivity<ContextFunction | undefined>`
- [ ] 3.2 Declare & export `LazyImportActivity<ImportType>` in `lazy-import.ts`, set it as `lazyImport`'s return type, pin the cache-hit cast to it, type `importLazy` with it, and delete the `@TODO`
- [ ] 3.3 Drop the `typeof Chart === 'function'` narrowing from the README Lazy imports example (restore plain truthiness) and re-verify the example type-checks

## 4. Verification & release

- [ ] 4.1 `pnpm -F @loom-js/core test-ci`, `type-check`, and `type-check-tests` all green
- [ ] 4.2 `pnpm format` over touched files; format check green
- [ ] 4.3 Add one minor changeset for `@loom-js/core` (**BREAKING** `append` → `placement` migration line included)
