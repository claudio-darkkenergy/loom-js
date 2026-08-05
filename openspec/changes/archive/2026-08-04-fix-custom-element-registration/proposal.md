## Why

`@loom-js/core` ships custom-element registration (added in `998e7bf`, "feat: add custom element & web component props support to core"), but the feature is effectively unreachable and partially unimplemented. This surfaced while restoring the core green baseline (`restore-core-green-baseline`), where deleting the orphaned `src/simple.ts` required understanding what the feature was supposed to do.

**Scope note.** This change targets **interop** — letting a non-loom page consume a loom component as `<pink-button>`. Authoring ergonomics (composing components readably inside loom templates) is a separate concern addressed by `add-template-component-syntax`, which needs no global registry, no element names, and no shadow DOM. The two changes are independent and can be sequenced in either order; this one should not be justified by readability arguments.

Registration is currently more complete than it appears: `get-attr-update.ts` already routes `$prop=${value}` on a custom element to real JS **properties** via `setCustomElementProps`, so objects, arrays, and functions pass through uncoerced, and `connectedCallback` merges `this.props` before mount. None of it runs only because no element is ever defined — an undefined tag yields `HTMLUnknownElement`, `isWebComponent` is undefined, and `setCustomElementProps` bails.

Confirmed gaps:

1. **Anonymous template functions register nothing, silently.** `component()` calls `registerCustomElement({ name: templateFunction.name, ... })` (`src/component.ts:118`), and `registerCustomElement` early-returns when `name` is falsy (`src/lib/templating/register-custom-element.ts:19`). The idiomatic form used everywhere in this repo and its apps — `const Input = component((html, props) => …)` — passes an **anonymous arrow**, so `templateFunction.name` is `''` and no element is ever defined. Every component in `packages/core/tests/support/components/`, `@loom-js/pink`, and `apps/loom` is written this way. The only way to reach the feature today is `component(function Named(html, props) { … })`, which is undocumented.
2. **No coverage until now.** Because of (1), zero tests exercised custom-element instantiation. `restore-core-green-baseline` added `tests/unit/custom-element.spec.ts` using a named template function — the first test to reach `connectedCallback`.
3. **`SimpleComponent`'s array return has no path through registration.** `registerCustomElement` does `const ctxFn = componentFunction(props)` then `ctxFn(this.ctx)`, assuming a single `ContextFunction`. `SimpleComponent` (exported from `index.ts`, used throughout `@loom-js/pink`) is typed to return `ContextFunction | ContextFunction[]` — the component function itself may return an array, which this code cannot call.

    **Note:** fragment roots are NOT a gap — this was claimed in an earlier draft and is incorrect. Verified: a `<>…</>` multi-root template mounts all of its root nodes into a custom element correctly, because `mount` spreads a `TemplateRootArray` into `replaceChildren(...)` (`src/lib/mount.ts:14-21`). Separately observed while testing: a template with multiple top-level elements and _no_ `<>` wrapper silently drops all but the first node — that is `component()`'s documented single-top-level-element constraint, not custom-element-specific, but the silent drop may warrant its own investigation.

4. **No mechanism for styling shadow-rooted content.** `shadowInit` defaults to `{ mode: 'open' }`, so rendered content is fully style-encapsulated, but the repo has no `adoptedStyleSheets`, `::part`, or `:host` usage anywhere — a shadow-rooted `@loom-js/pink` component would render completely unstyled. (`open` vs `closed` is irrelevant here: verified that both block document stylesheets identically; `mode` only controls whether `host.shadowRoot` is reachable from JS. `open` is correct — `closed` would break tests, devtools, and external querying while buying no additional encapsulation.)
5. **Plain-function components cannot register at all.** `src/simple.ts` was the intended opt-in wrapper for this, but it never compiled (it imported `SimpleTemplateFunction`, a type that has never existed in any commit), was never exported from `index.ts`, never called, and never tested. It was deleted in `restore-core-green-baseline` rather than repaired, because repairing it requires resolving (3) — a design change, not a type fix.

## What Changes

- **Make registration explicit opt-in via `defineElement()`** (DECIDED by maintainer). Defining a component SHALL NOT define a global custom element as a side effect. `component()` stays pure and loses all knowledge of custom elements; `defineElement(name, templateFunction)` is `component()` plus registration in a single call, returning the same `Component` so it remains directly callable. Use one or the other, never both. Apps that never import `defineElement` do not pull registration into the bundle.

    ```ts
    export const Card = component(
        (html, props) => html`
            …
        `
    ); // no element
    export const PinkButton = defineElement(
        'pink-button',
        (html, props) => html`
            …
        `
    ); // + <pink-button>
    ```

- **Deriving the name automatically is not viable** — recorded so it is not revisited. `import.meta.url` inside `component.ts` resolves to core's own module URL, not the caller's; stack-trace inspection breaks under bundling and minification; a build-time transform would make a compiler step mandatory for a framework that runs from a plain `<script>`; and filenames are neither unique (`index.ts`) nor singular (files export several components) in this repo.
- **Decide whether plain-function (`SimpleComponent`) components get registration**, and if so reintroduce the `simple.ts` wrapper designed against the real `ContextFunction | ContextFunction[]` contract.
- **Make shadow DOM a per-element choice** (DECIDED by maintainer), configured through `defineElement`'s options rather than a framework-wide default. Leaf components that own their styling can encapsulate; components that must inherit app styles render in the light DOM (i.e. no shadow root — ordinary children in the document tree, where normal CSS applies).
- **Provide a way for app/theme styles to reach shadow-rooted content** when shadow is chosen (CSS custom properties, `adoptedStyleSheets`, `::part`, host classnames, or some combination). Note that shadow DOM blocks document stylesheets _automatically_, and `adoptedStyleSheets` is an explicit per-root push that core would have to perform for every element it creates — nothing is inherited. Keep `mode: 'open'`.
- **Document the feature** in `packages/core/README.md` — it is currently undocumented.
- **Cover it**: extend `tests/unit/custom-element.spec.ts` with the `$`-attribute→prop mapping, children pass-through, the fragment-root case (as a regression guard — it works today), and the shadow-root-disabled (`shadowInit: false`) path.

Non-goals: changing the `$`-prefixed attribute convention; SSR/hydration of custom elements (see `add-server-rendering`).

## Capabilities

### New Capabilities

- `custom-element-registration`: Components defined with `@loom-js/core` can be reliably registered and instantiated as custom elements, with a predictable element name, support for fragment roots, and no silent no-ops.

## Impact

- **Code:** `packages/core/src/lib/templating/register-custom-element.ts`, `packages/core/src/component.ts`, possibly `packages/core/src/lib/mount.ts` and `src/types.ts`; `packages/core/README.md`; `packages/core/tests/unit/custom-element.spec.ts`.
- **Risk:** Medium. Fixing name derivation could begin registering elements for components that currently register nothing — a behavior change for every existing consumer. Element names must not collide, and `customElements.define` throws on re-definition.
- **Release:** Minor changeset if a new public API (`elementName` option / `defineElement` / `simple`) lands; patch if the change is limited to array-root support.
- **Verification:** `type-check`, `type-check-tests`, `test-ci`; new specs covering the array-root and naming paths.

## Open Questions

- **RESOLVED:** Implicit or explicit registration? → **Explicit, via a separate `defineElement()` used instead of `component()`.**
- **RESOLVED:** Shadow DOM default? → **Per-element choice** through `defineElement` options, **defaulting to light DOM** (no shadow root). Registration and encapsulation are separate opt-ins. `mode` stays `open` — `closed` adds no style encapsulation (verified: both block document stylesheets identically) and only makes `host.shadowRoot` unreachable, breaking tests, devtools, and external queries.
- **UNDECIDED (maintainer):** Do `SimpleComponent` (plain-function) components need registration — i.e. should `@loom-js/pink`'s components be usable as `<pink-container>` — or is `defineElement` the only supported path? This is the only reason the array-return case (`ContextFunction[]`) would need handling in registration. No use case has been identified yet.
- Which mechanism carries app/theme styles into a shadow root?
- Named slots require shadow DOM natively. If light-DOM elements need multiple named regions, loom would have to distribute `[slot]` children itself. Is that wanted, or are unnamed children (already supported via the `children` prop) sufficient?
- Registration must happen before a consuming template is parsed, since the element must be upgraded for `isWebComponent` to be true when attribute updaters run. What is the import-order story?
