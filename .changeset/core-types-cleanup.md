---
'@loom-js/core': minor
---

Type-surface cleanup (breaking, types-only — no runtime behavior changes).

**Removed exports** (migration in parentheses): `ComponentArgs` (→ `ComponentOutputProps`), `ComponentProps` (→ `ComponentOutputProps`), `ComponentOptionalProps` (→ `ReservedProps`), `RenderFunction` (→ `TemplateFunction`), `RenderProps` (→ `ComponentOutputProps`), plus the dead `ComponentBaseArgs` (→ `ComponentBaseProps`), `GlobalConfig`, `GlobalWindow`, and `NodeFilter` (the DOM global was always used at runtime).

**Required props are now enforced**: `Component<Props>` and `SimpleComponent<Props>` require the props argument when `Props` has at least one required member; propless calls still type-check when all props are optional.

**New `simple()` factory**: the pass-through counterpart to `component()`. Wrap pass-through implementations in `simple<Props>(render)` — the render function always receives a props object (`{}` is supplied at runtime on propless calls), so it can destructure without a `= {}` default, while callers keep the conditional `SimpleComponent<Props>` signature. Bare functions annotated `SimpleComponent<Props>` with all-optional `Props` must otherwise tolerate `undefined` props themselves; migrating them to `simple()` is the intended pattern.

**Tightened signatures**: `LifeCycleHandler`, `SyntheticRouteEventListener`, and `AppInitProps.onAppMounted` now return `void` instead of `any` (callbacks returning values still type-check); `ReactiveComponent` defaults to `<unknown, TemplateTagValue>`; `GetProps` falls back to `never`; `TaggedTemplate` declares its bound context as a proper `this` parameter. The `Props` generic now threads through `component()` end-to-end, so template functions see fully-typed props without casts.
