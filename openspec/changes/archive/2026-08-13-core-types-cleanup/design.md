## Context

`packages/core/src/types.ts` is the single public type surface for `@loom-js/core`, re-exported via `index.ts`. Assessment findings (2026-08-13):

- **Generic drop in the factory** — `component.ts` annotates the inner value as bare `Component`, so everything inside runs at `Component<{}>` and the real `Props` is re-asserted through four casts, including one through the deprecated `ComponentArgs` alias. The public signature is only correct because `ComponentFactory`'s own generic re-imposes it at the boundary.
- **Optional props always** — `Component<Props>` is `(props?: ComponentInputProps<Props>) => ContextFunction`. A component with required props type-checks when called with none.
- **Deprecated aliases with live consumers** — `ComponentArgs` (core `component.ts`), `ComponentOptionalProps` (core `router.ts`, core tests), `ComponentProps` (`@loom-js/pink` stories). `RenderFunction` / `RenderProps` are exported with zero consumers anywhere in the monorepo. `Aria` carries a `@deprecated` comment in `index.ts` but is genuinely used by two pink components.
- **Dead / hazardous exports** — `ComponentBaseArgs` duplicates `ComponentBaseProps` exactly; `GlobalConfig` and `GlobalWindow` have no consumers; the local `NodeFilter` interface shadows the DOM lib global (all runtime code already reads `window.NodeFilter`).
- **Loose `any`s** — `ReactiveComponent<T = any, P = any>`, `LifeCycleHandler` / `SyntheticRouteEventListener` / `AppInitProps.onAppMounted` return `any`, `GetProps` falls back to `any`.
- **Oddities** — `TaggedTemplate` declares `this?: ComponentContext` as an interface _member_ rather than a `this` parameter; `Es6Object` and `PlainObject` overlap (symbol keys being the only difference, and `reactive.ts` does rely on symbol keys).

Constraints: strict TS 7 (`noUncheckedIndexedAccess`), zero runtime dependencies, runtime behavior must not change, and `core-baseline-health` (clean `type-check`, `type-check-tests`, `test-ci`) is the regression gate.

## Goals / Non-Goals

**Goals:**

- `Props` flows factory → component → template function with no casts in `component.ts`.
- Required props are required at call sites; propless calls stay ergonomic (`MyComponent()` still works when all props are optional).
- Public surface contains only types with a real consumer or documented purpose; no first-party code imports a deprecated alias.
- Replace `any` with `unknown`/`void`/generics where it cannot change what consumers can legally write (widening returns `any → void`/`unknown` is safe; narrowing parameters is not — assess per site).

**Non-Goals:**

- No runtime behavior changes. (Refined during apply: "byte-identical `dist/`" proved too strict — the implementation needed a handful of behavior-neutral JS diffs, enumerated in Risks below.)
- No redesign of the props model (`ReservedProps`, slots, refs stay as-is).
- No `Aria` removal or pink migration off `Aria` (tracked as an open question).
- No splitting `types.ts` into per-domain files — worth considering someday, but it multiplies the diff and risks import-order churn under the prettier sort plugin for zero consumer-visible benefit.

## Decisions

### Decision 1: Parameterize the factory implementation, not just its type

`component` keeps the `ComponentFactory` annotation, but the inner `componentFunction` becomes `Component<Props>` and `contextFunction`'s context handling uses `ComponentContext<Props>` keys where the maps allow. Where the context maps are intentionally heterogeneous (`ctxScopes: Map<TemplateFunction, ...>` stores _every_ component's scope), the variance boundary moves into the `ComponentContext` type itself (keying by `TemplateFunction<any>` — an explicit, commented variance escape) rather than being re-asserted at each call site. Casts in `component.ts` drop from four to zero; the `ComponentArgs` cast is replaced by building the object as `ComponentOutputProps<Props> & UtilityProps` directly.

_Alternative considered_: leave the implementation loose and keep the factory-boundary assertion — rejected; that's the current state, and it's why the deprecated alias survived inside core.

### Decision 2: Conditional props optionality via overload-free conditional type

```ts
export type Component<Props extends object = {}> = {} extends Props
    ? (props?: ComponentInputProps<Props>) => ContextFunction
    : (props: ComponentInputProps<Props>) => ContextFunction;
```

`{} extends Props` is true exactly when `Props` has no required members, so `Button()` keeps working while `Field({ label })` becomes mandatory. Same treatment for `SimpleComponent`. This can surface latent errors in consumers that were silently under-passing required props — that's the point, and in-repo consumers get fixed in this change.

_Alternative considered_: overloads — noisier in `.d.ts` output and worse inference through `AnyComponent` unions.

### Decision 3: Removal set and migration mapping

Removed from `types.ts` and `index.ts` in one commit, with all consumers migrated in the same commit:

| Removed                                      | Replacement            | Consumers to migrate                  |
| -------------------------------------------- | ---------------------- | ------------------------------------- |
| `ComponentArgs`                              | `ComponentOutputProps` | `core/src/component.ts`               |
| `ComponentProps`                             | `ComponentOutputProps` | `pink/.../pink-box.stories.ts`        |
| `ComponentOptionalProps`                     | `ReservedProps`        | `core/src/router.ts`, `core/tests/**` |
| `RenderFunction`                             | `TemplateFunction`     | none                                  |
| `RenderProps`                                | `ComponentOutputProps` | none                                  |
| `ComponentBaseArgs`                          | `ComponentBaseProps`   | none                                  |
| `GlobalConfig`, `GlobalWindow`, `NodeFilter` | — (dead)               | none                                  |

`Aria` stays exported and keeps its deprecation note (see Open Questions).

### Decision 4: `any` tightening — returns widen, parameters hold

- `LifeCycleHandler`, `SyntheticRouteEventListener`, `onAppMounted`: return type `any → void`. Callers never consume these returns; `void` return position accepts any callback, so no consumer breaks.
- `ReactiveComponent<T = any, P = any>` → `<T = unknown, P = TemplateTagValue>`, matching what the transform actually produces.
- `GetProps` fallback `any → never` (the conditional's false branch is unreachable given the constraint; `never` surfaces misuse instead of silencing it).
- `Es6Object` / `PlainObject` both stay: `reactive.ts` needs symbol keys (`Es6Object`), the templating/props paths need string-keyed (`PlainObject`). Add a one-line comment to each stating the distinction so the pair stops looking like accidental duplication.

### Decision 5: `TaggedTemplate.this` becomes a `this` parameter

```ts
export interface TaggedTemplate {
    (
        this: ComponentContext | void,
        chunks: TemplateStringsArray,
        ...interpolations: TemplateTagValue[]
    ): ComponentContext;
}
```

The current `this?: ComponentContext` member declares a _property named `this`_, which nothing reads or writes; the runtime binds context via `htmlParser.bind(ctx)`. A `this` parameter states the actual contract.

### Decision 6: `simple()` factory instead of per-implementation `= {}` defaults

Added mid-apply at the maintainer's direction. The `= {}` destructure defaults that Decision 2 forced onto ~19 `SimpleComponent` implementations put the runtime guarantee in the wrong place: `component()`-based components never had the problem because the factory sits between caller and implementation and defaults the props. `simple()` gives pass-through components the same treatment:

```ts
export const simple = <Props extends object = {}>(
    render: (
        props: ComponentInputProps<Props>
    ) => ContextFunction | ContextFunction[]
) => {
    const simpleComponentFunction: SimpleComponent<Props> = (
        props: ComponentInputProps<Props> = {} as ComponentInputProps<Props>
    ) => render(props);

    return simpleComponentFunction;
};
```

The `render` parameter's props are _required_, so implementations destructure with no default and the guarantee is real (the factory's runtime default supplies `{}`), not asserted. The public type stays the conditional `SimpleComponent<Props>`. The single `{} as ComponentInputProps<Props>` cast collapses from ~19 sites into this one factory, mirroring `component.ts`.

_Name_: `simple` — the maintainer's historical name for this exact function; adjective-pairs with the `SimpleComponent` type it returns (`component()` → `Component`, `simple()` → `SimpleComponent`). Alternatives considered: `simpleComponent` (fully symmetric but long), `passthrough` (docs vocabulary but names the mechanism, not the type), `fc` (cryptic).

_Alternative considered and rejected_: keeping bare functions and casting a required-props implementation to `SimpleComponent<Props>` — type-checks but lies; a propless call would still pass `undefined` at runtime and the destructure would throw.

_Consequence_: expando property assignment (`PinkTag.Tag = Tag`) no longer type-checks on a factory-returned function (TS only allows expando on function-expression initializers) — such sites use `Object.assign(simple(...), { Tag })`.

## Risks / Trade-offs

- [Decision 2 breaks consumers that under-passed required props] → That code was already wrong at runtime; pre-1.0 minor bump, changeset documents the tightening, in-repo consumers fixed in-change. Rollback: revert to unconditional `props?`.
- [`ComponentContext<Props>` generic tightening ripples into `lib/context` and `lib/templating` internals] → Keep the internal maps keyed at the variance boundary (`TemplateFunction<any>` inside the type, commented); if a tightening cascades beyond `component.ts`/`types.ts`, stop and keep that site as-is — internal cast reduction must not become an internals rewrite.
- [Cast removal could mask a real runtime shape mismatch] → Verified by full gates (`type-check`, `type-check-tests`, `test-ci` — 188 tests, pink + loom `type-check`).
- [Behavior-neutral JS diffs introduced during apply — the full list]:
    1. `component.ts` builds props into a local `inputProps` const (reading `ctx.props` back would erase the `Props` types); same object, same assignments.
    2. `component.ts` keeps one commented cast: the propless-call default `{} as ComponentInputProps<Props>` — legal because the public conditional signature only permits propless calls when `Props` has no required members. The four `Props`-re-imposing casts are gone; residual `X | undefined` narrowing uses `!` (which erases to nothing).
    3. `life-cycles.ts` replaced the `handler(root) & event(root)` bitwise-sequencing idiom (compiled only under `any` returns) with a two-statement body — same call order, result was always discarded.
    4. ~19 `SimpleComponent` implementations (core `Picture`, 12 pink files, 6 loom files) initially gained `= {}` destructure defaults — the conditional type makes all-optional-props components accept propless calls, which destructuring implementations must tolerate. Superseded by Decision 6: they now wrap in `simple()`, which centralizes the default; `PinkTag`'s expando `.Tag` becomes an `Object.assign`.
- [Pink stories use `StoryObj<ComponentProps<...>>` — Storybook may infer differently with `ComponentOutputProps`] → The alias is defined _as_ `ComponentOutputProps`, so this is a pure rename; pink `type-check` confirms.

## Migration Plan

1. Land types.ts + component.ts + router.ts + index.ts changes with core tests and pink migrated in the same commit (monorepo stays green at every commit).
2. Changesets: `@loom-js/core` minor (breaking pre-1.0), `@loom-js/pink` patch.
3. Rollback: single revert commit; no data or runtime migration exists.

## Open Questions

- **`Aria`'s future**: `index.ts` marks it deprecated in favor of `ReservedProps['attrs']`, but pink uses it as a structured prop (`aria?: Aria`), which is arguably the better API. Recommendation: un-deprecate it or fold aria handling into `ReservedProps` in a follow-up change — decide when pink's prop conventions are next revisited, not here.
