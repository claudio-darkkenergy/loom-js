## Context

Spun out of `element-syntax-first` (its design Decisions 4–6 fix the WHAT; this change designs the HOW). Core already ships `sideEffects: false` with a rollup ES bundle, so tree-shakeability is a matter of named exports with no module-level work. The 2026-08-10 audit fixed the consumer contracts these components must satisfy: `is=${el('footer')}` (root-tag polymorphism), `el('h2')({ children, className, id })` (third-party render callbacks), `withIcon`-style transformers building an icon `Span` into a props object, `Svg`/`Picture` used once each in the app. Relevant precedent: `makeChildrenComponent` (`compile-component-tags/emit.ts`) already invokes a component's bound `html` with a constructed chunks array — the mechanism `el()` needs.

## Goals / Non-Goals

**Goals:**

- `RouteLink`, `Svg`, `Picture`, `el(tagName)` as tree-shakeable named exports of `@loom-js/core`, each byte-budgeted, TDD'd.
- API parity with the audited consumer shapes so the conversion change is mechanical.

**Non-Goals:**

- Converting any pink/app file (follow-up change).
- Porting `Text`, `ListItems`, `mergeAllowedAttrs`, pure wrappers, or tags' standalone `ResponsiveImage`/`Source` exports.
- `RouteLink` active-state (deferred by `element-syntax-first` Decision 5).
- Router or templating requirement changes.

## Decisions

### Decision 1: New `src/elements/` folder, re-exported from `index.ts`

`route-link.ts`, `media.ts` (Svg, Picture, Source internals), `el.ts`, plus an `elements/index.ts`. Flat named exports from the package root (`import { RouteLink, Svg, Picture, el } from '@loom-js/core'`) — `sideEffects: false` plus no module-level execution keeps unused exports shakeable. Alternative considered: a separate entry point (`@loom-js/core/elements`) — rejected for v1; the exports are tiny and a second entry complicates the CJS/ESM dual build for no measured win.

### Decision 2: `el(tagName)` builds one chunks array per tag, memoized — memoization is correctness, not convenience

Template contexts cache by chunks-array identity, so `el('footer')` must return the same component (with the same chunks array) every call or re-renders would never reuse DOM. Implementation: a `Map<string, Component>`; on miss, construct chunks `['<tag $attrs=', ' $on=', ' class=', '>', '</tag>']` (childless for void tags, per a void-tag check) and a `component()` whose render invokes its bound `html` with that array — the `makeChildrenComponent` precedent. Props surface: `{ attrs, on, className, children }` plus passthrough of `id`/`style` via `attrs` — deliberately smaller than tags' flat-prop allowlist; `$attrs` is the arbitrary-attribute channel, consistent with element syntax. Alternative considered: per-tag eager wrappers (the tags model) — rejected, it's the 33-export surface this change deletes.

### Decision 3: `RouteLink` wires `route()` on `$click`; non-SPA activations fall through

Template component: `<a href=${href} target=${target} $attrs=${attrs} $click=${handler}>${children}</a>`. The handler delegates to core `route(event)` only for SPA-eligible activations — same-origin href and not `target="_blank"`; otherwise it does nothing and the browser default proceeds. Modifier-key/middle-click handling: whatever `onRoute`/`route` already does stays authoritative — `RouteLink` adds no second policy layer (verify during TDD; extend `route` itself if a gap shows, as a separate finding). Alternative considered: porting tags' `Link` — rejected (settled): it carries no routing behavior, only attr defaults.

### Decision 4: `Picture` is a thin chooser over two internal template components

A component's template has one fixed root, so "`<picture>` when `sources`, bare `<img>` when not" cannot be one template. `Picture` stays a `SimpleComponent`-shaped chooser (the proven tags/`ResponsiveImage` shape) delegating to two internal `component()`s — `<picture>` wrapping per-source `<source>`s and the img, or the img alone. `SourceProps` exported as a type; the `<source>` markup is internal. `Svg` ports essentially verbatim (it is already a well-shaped `component()`); its `mergeAllowedAttrs` sibling usage does not come along — `$attrs` passthrough only.

### Decision 5: Byte budgets per addition, set in tasks section 0

Against the freshly measured baseline (post-`add-spread-props`: 9,944 B min+gzip, same measurement command). Expectations to be ratified by section 0: `el()` and `RouteLink` small (one template each plus factory/handler logic), `Svg` small, `Picture` medium (two internal components + chooser). Per repo discipline: budgets are ceilings; a breach is a design smell to redesign, not renegotiate.

## Risks / Trade-offs

- **[Template-identity subtleties in `el()`]** — dynamic chunks arrays are a first outside the compiler; a bug here corrupts DOM reuse. → TDD includes re-render/reconciliation specs (same `el` component across updates reuses nodes), not just first-render output.
- **[`RouteLink` policy gaps]** (external-origin detection, hash links, modifier keys) → specs enumerate the fall-through cases explicitly; anything `route()` itself mishandles is filed against the router, not patched in `RouteLink`.
- **[Budget creep across four additions]** → each addition measured separately in section 3; the sum is also recorded.

## Open Questions

None blocking — consumer contracts are fixed by the audit; remaining unknowns (exact prop names on `el()`'s surface beyond the audited uses) resolve during TDD against the conversion sites.
