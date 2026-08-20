## Why

`packages/core/src/types.ts` (445 lines, the package's entire public type surface) has accumulated drift: the `Props` generic is dropped inside `component()` and papered over with casts, five deprecated aliases are still consumed by core's own source and in-repo packages, several exported types are dead or duplicated, and `any` appears where `unknown` or a threaded generic belongs. This erodes the type safety consumers get from the framework (e.g. a `Component<{ label: string }>` can be called with no props at all) and makes the surface harder to maintain.

## What Changes

- **Thread generics through `component()`**: the inner `componentFunction` is annotated as bare `Component` (i.e. `Component<{}>`), which forces four casts (`as TemplateFunction`, `as TaggedTemplate`, `as ComponentOutputProps<Props>`, `as ComponentArgs<Props>`) and loses internal type safety. Parameterize the implementation so the generic flows factory → component → template function without casts.
- **Enforce required props**: `Component<Props>` declares `props?: ...` unconditionally, so components whose `Props` contain required members still accept zero-arg calls. Make props optionality conditional on whether `Props` has required keys.
- **BREAKING — remove dead deprecated aliases**: `ComponentArgs`, `ComponentProps`, `ComponentOptionalProps`, `RenderFunction`, `RenderProps`. Internal consumers (`component.ts`, `router.ts`, core tests) and in-repo consumers (`@loom-js/pink` stories) migrate to the canonical names (`ComponentOutputProps`, `ReservedProps`, `TemplateFunction`).
- **BREAKING — delete dead/duplicate exports**: `ComponentBaseArgs` (byte-for-byte duplicate of `ComponentBaseProps`), `GlobalConfig`, `GlobalWindow`, and the local `NodeFilter` interface (shadows the DOM global; core already uses `window.NodeFilter`). None have any consumer in the monorepo.
- **Tighten loose `any`s**: `ReactiveComponent<T = any, P = any>` defaults, `LifeCycleHandler` / `SyntheticRouteEventListener` / `onAppMounted` returning `any`, and the `GetProps` `any` fallback move to `unknown`/`void` or proper generics where behavior-neutral.
- **Fix oddities**: `TaggedTemplate`'s `this?: ComponentContext` member becomes a proper `this` parameter on the call signature; assess `Es6Object` vs `PlainObject` overlap (keep both only if the symbol-key distinction is load-bearing for `reactive.ts`).
- **New `simple()` factory** (added during apply, at the maintainer's direction): the pass-through counterpart to `component()`. It guarantees the implementation always receives a props object — the runtime `{}` default lives once in the factory instead of as `= {}` destructure defaults scattered across every `SimpleComponent` implementation — while the public conditional `SimpleComponent` signature still lets callers skip props when all members are optional.
- `Aria` is deprecated in `index.ts` but genuinely used by `@loom-js/pink` — it stays exported; its final disposition is a design decision, not part of this removal set.

## Capabilities

### New Capabilities

- `core-type-surface`: The public type contract of `@loom-js/core` — generics thread end-to-end through the component factory, required props are enforced at call sites, every exported type has at least one real consumer or a documented purpose, and no deprecated alias is consumed by first-party code.

### Modified Capabilities

<!-- No existing spec's requirements change. `core-baseline-health` (clean type-check) continues to hold and acts as the regression gate. -->

## Impact

- **Code**: `packages/core/src/types.ts`, `component.ts`, `router.ts`, `index.ts`, `app.ts`; `packages/core/tests/**` (uses `ComponentOptionalProps`); `packages/pink/src/**` (uses `ComponentProps` in stories).
- **API**: Breaking removal of five deprecated aliases plus four dead exports from `@loom-js/core`'s public surface. Package is pre-1.0 (`0.6.0`); ships as a changeset minor bump per pre-1.0 semver convention. `@loom-js/pink` needs a changeset too since its source is touched.
- **Verification**: `pnpm -F @loom-js/core type-check`, `type-check-tests`, `test-ci`, and `pnpm -F @loom-js/pink type-check` must all pass; runtime behavior is unchanged (types-only change, except prop-optionality which only tightens compile-time checks).
