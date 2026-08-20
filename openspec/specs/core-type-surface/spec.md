## Purpose

Defines the public type contract of `@loom-js/core`: the `Props` generic threads end-to-end from `component()` through the returned component to the template function without casts, required props are enforced at call sites while all-optional props keep propless calls legal, and the surface carries no dead or deprecated exports. Pass-through components are declared via the `simple()` factory, public callbacks return `void` rather than `any`, and `TaggedTemplate` models its context as a proper `this` parameter. Lazy imports present a typed activity: `lazyImport` returns the exported `LazyImportActivity<ImportType>` on both cache paths, so consumed values carry `ImportType | undefined` without narrowing.

## Requirements

### Requirement: Component factory threads the Props generic without casts

`component()` SHALL propagate its `Props` type parameter through the returned component and into the template function's props argument, with no type assertions (`as`) re-imposing `Props` on context values inside `packages/core/src/component.ts`. The single permitted assertion is the commented propless-call default (`{} as ComponentInputProps<Props>`), which encodes what the public conditional signature already guarantees — propless calls are only legal when `Props` has no required members.

#### Scenario: template function receives typed props

- **WHEN** a component is defined as `component<{ label: string }>((html, { label }) => ...)`
- **THEN** `label` resolves as `string` inside the template function without a cast
- **AND** `pnpm -F @loom-js/core type-check` passes with no `as ComponentOutputProps` / `as ComponentArgs` assertions remaining in `component.ts`

### Requirement: Required props are enforced at call sites

`Component<Props>` and `SimpleComponent<Props>` SHALL require a props argument when `Props` contains at least one required member, and SHALL keep the props argument optional when all members of `Props` are optional.

#### Scenario: component with required props rejects a propless call

- **WHEN** `const Field = component<{ label: string }>(...)` is invoked as `Field()`
- **THEN** TypeScript reports a compile-time error

#### Scenario: component with only optional props keeps propless calls

- **WHEN** `const Button = component<{ variant?: string }>(...)` is invoked as `Button()`
- **THEN** the call type-checks without error

### Requirement: Deprecated aliases are removed and first-party code migrated

The exports `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps`, `RenderFunction`, and `RenderProps` SHALL NOT exist in `@loom-js/core`'s public surface, and no first-party workspace (core source, core tests, `@loom-js/pink`, `apps/loom`) SHALL import them. `Aria` SHALL remain exported.

#### Scenario: removed aliases are gone from the surface

- **WHEN** `@loom-js/core`'s exports are inspected (via `index.ts` or the built `index.d.ts`)
- **THEN** none of `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps`, `RenderFunction`, `RenderProps` are exported

#### Scenario: first-party consumers use canonical names

- **WHEN** the monorepo is searched for the removed alias names
- **THEN** no source file under `packages/core/src`, `packages/core/tests`, `packages/pink/src`, or `apps/loom` references them
- **AND** `pnpm -F @loom-js/core type-check`, `pnpm -F @loom-js/core type-check-tests`, and `pnpm -F @loom-js/pink type-check` all pass

### Requirement: Dead and shadowing type exports are deleted

`ComponentBaseArgs`, `GlobalConfig`, `GlobalWindow`, and the local `NodeFilter` interface SHALL be removed from `packages/core/src/types.ts`.

#### Scenario: dead types are removed without fallout

- **WHEN** the four types are deleted
- **THEN** `pnpm -F @loom-js/core type-check` and `test-ci` pass, confirming they had no consumers
- **AND** references to `NodeFilter` in runtime code continue to resolve to the DOM global

### Requirement: Public callback types do not return `any`

`LifeCycleHandler`, `SyntheticRouteEventListener`, and `AppInitProps.onAppMounted` SHALL declare a `void` return type, and `ReactiveComponent`'s type parameters SHALL default to non-`any` types.

#### Scenario: existing callbacks still type-check

- **WHEN** a consumer passes a callback that returns a value (e.g. an arrow with implicit return) to `onCreated` or `onAppMounted`
- **THEN** the call still type-checks (void-return position accepts any callback)
- **AND** no public type in `types.ts` uses `any` as a return type or generic default, except explicitly commented variance escapes

### Requirement: `simple()` factory guarantees a props object to pass-through implementations

`@loom-js/core` SHALL export a `simple<Props>()` factory that accepts a render function whose props parameter is a required `ComponentInputProps<Props>`, and SHALL return a `SimpleComponent<Props>` that supplies `{}` at runtime when the caller passes no props. First-party pass-through components SHALL be declared via `simple()` rather than bare `SimpleComponent`-annotated functions with `= {}` destructure defaults.

#### Scenario: implementation destructures without a default

- **WHEN** a pass-through component is declared as `simple<PictureProps>(({ sources, ...imgProps }) => ...)`
- **THEN** the destructure type-checks with no `= {}` default
- **AND** calling the component with no arguments invokes the render function with `{}`

#### Scenario: caller obligations still follow the conditional signature

- **WHEN** `simple<{ label: string }>(...)` produces a component
- **THEN** propless calls are a compile-time error, while `simple<{ label?: string }>(...)` components accept propless calls

### Requirement: TaggedTemplate declares its context as a `this` parameter

`TaggedTemplate` SHALL declare `this: ComponentContext | void` as a call-signature `this` parameter rather than an optional interface member named `this`.

#### Scenario: bound usage type-checks

- **WHEN** the runtime binds the parser with `htmlParser.bind(ctx)` and templates invoke `html\`...\``
- **THEN** both the bound call in `component.ts` and unbound test usage type-check under the new signature

### Requirement: Lazy imports return a typed activity

`lazyImport<ImportType>` SHALL declare its return type as the concrete activity instantiation for its import — `LazyImportActivity<ImportType>`, defined as `ReturnType<typeof activity<ImportType | undefined, () => Promise<ImportType>>>` and exported from the module — and both the cache-hit and cache-miss paths SHALL return that type, so consumers receive `ImportType | undefined` values from `effect`, `watch`, and `value()` without narrowing or casts. `importLazy` SHALL be typed as `LazyImportActivity<ContextFunction | undefined>`, resolving its standing `@TODO` by contract.

#### Scenario: effect values are typed on the cache-miss path

- **WHEN** a first `lazyImport<Component>('key', importer)` call's activity is consumed via `effect(({ value }) => …)` under type-checking
- **THEN** `value` is typed `Component | undefined` and truthiness narrowing suffices to call it — no `typeof` narrowing or cast is required

#### Scenario: cache-hit path carries the same type

- **WHEN** a repeat `lazyImport<Component>('key', importer)` call returns the cached activity under type-checking
- **THEN** its static type equals the first call's `LazyImportActivity<Component>` — `value()` is `Component | undefined`, not `unknown`

#### Scenario: importLazy is typed for renderable content

- **WHEN** `importLazy(path, importer)` is consumed under type-checking
- **THEN** it presents `LazyImportActivity<ContextFunction | undefined>` with no `@TODO` remaining on the export
