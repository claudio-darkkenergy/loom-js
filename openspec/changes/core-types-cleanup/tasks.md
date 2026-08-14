## 1. Dead-type removal (no consumers, lowest risk)

- [x] 1.1 Delete `ComponentBaseArgs`, `GlobalConfig`, `GlobalWindow`, and `NodeFilter` from `packages/core/src/types.ts`; confirm `pnpm -F @loom-js/core type-check` stays green
- [x] 1.2 Remove `RenderFunction` and `RenderProps` from `types.ts` and `index.ts` (zero consumers monorepo-wide)

## 2. Deprecated-alias migration and removal

- [x] 2.1 Migrate `router.ts` off `ComponentOptionalProps` to `ReservedProps`
- [x] 2.2 Migrate core tests (`tests/unit/activity.spec.ts`, `tests/support/run-setup.ts`, plus `tests/support/components/container.ts`, found during apply) off `ComponentOptionalProps`; run `pnpm -F @loom-js/core type-check-tests`
- [x] 2.3 Migrate `packages/pink/src/elements/pink-box/pink-box.stories.ts` from `ComponentProps` to `ComponentOutputProps`; run `pnpm -F @loom-js/pink type-check`
- [x] 2.4 Remove `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps` from `types.ts` and `index.ts` (done after 3.1 removed the last `ComponentArgs` use)

## 3. Generic threading in `component.ts`

- [x] 3.1 Parameterize `componentFunction` as `Component<Props>` and remove the `as TemplateFunction`, `as TaggedTemplate`, `as ComponentOutputProps<Props>`, and `as ComponentArgs<Props>` casts, per design Decision 1 (variance boundary lives in `ComponentContext`, commented)
- [x] 3.2 Convert `TaggedTemplate`'s `this?: ComponentContext` member to a call-signature `this: ComponentContext | void` parameter; verify bound (`htmlParser.bind`) and test usage both type-check

## 4. Required-props enforcement

- [x] 4.1 Make `Component<Props>` and `SimpleComponent<Props>` conditionally require the props argument (`{} extends Props` check, design Decision 2)
- [x] 4.2 Fix any in-repo call sites the tightening surfaces (core tests, pink, `apps/loom`); run all four type-check gates — surfaced ~19 `SimpleComponent` implementations (1 core, 12 pink, 6 loom) needing `= {}` destructure defaults, plus an optional-props param on `PinkTag`

## 5. `any` tightening

- [x] 5.1 Change `LifeCycleHandler`, `SyntheticRouteEventListener`, and `AppInitProps.onAppMounted` return types to `void` — surfaced a `handler(root) & event(root)` bitwise-sequencing idiom in `life-cycles.ts` that only compiled under `any`; replaced with an explicit two-statement body
- [x] 5.2 Change `ReactiveComponent` defaults to `<T = unknown, P = TemplateTagValue>` and `GetProps` fallback to `never`
- [x] 5.3 Add distinguishing comments to `Es6Object` (symbol keys, `reactive.ts`) and `PlainObject` (string keys)

## 6. `simple()` factory (added at maintainer's direction, design Decision 6)

- [x] 6.1 Add `simple()` to `packages/core/src/simple.ts`, export from `index.ts`; rebuild core dist
- [x] 6.2 Convert core `Picture` (media.ts) to `simple<PictureProps>`, removing its `= {}` default
- [x] 6.3 Convert the 12 pink `SimpleComponent` implementations to `simple()` (TS-AST codemod); `PinkTag` becomes `Object.assign(simple<PinkTagProps>(...), { Tag })`
- [x] 6.4 Convert the 6 loom-app `SimpleComponent` implementations to `simple()`
- [x] 6.5 Update both changesets to document the new `simple` export and the factory-based migration

## 7. Verification and release

- [x] 7.1 Add changesets: `@loom-js/core` minor (documents removed exports + props tightening with migration mapping), `@loom-js/pink` patch — note: `changeset status` escalates pink to major via the peer-range rule (core `^0.6.0` → `^0.7.0`); release-policy decision left to the maintainer
- [x] 7.2 Re-run full gates after the `simple()` conversion: `pnpm -F @loom-js/core type-check`, `type-check-tests`, `test-ci` (exit 0, all tests passed), `pnpm -F @loom-js/pink type-check`, `pnpm -F @loom-js/loom type-check`, `pnpm format:check` — all green; zero `= {}` destructure defaults remain in core/pink/loom sources
