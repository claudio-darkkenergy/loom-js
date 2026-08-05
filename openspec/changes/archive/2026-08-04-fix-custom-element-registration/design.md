## Context

Custom-element registration exists in `@loom-js/core` but has never run. `component()` calls `registerCustomElement({ name: templateFunction.name, componentFunction })` (`src/component.ts:118`), and `registerCustomElement` early-returns on a falsy name (`src/lib/templating/register-custom-element.ts:19`). Every component in this repo and its apps is written as `component((html, props) => …)` — an anonymous arrow whose `.name` is `''`.

**Verified:** a repo-wide grep for a named template function passed to `component()` returns exactly one hit — `packages/core/tests/unit/custom-element.spec.ts:10`, added by `restore-core-green-baseline` specifically to reach this code. Nothing in `packages/*`, `apps/*`, or `lib/*` registers an element today.

That single fact sets the shape of this change: removing implicit registration is not a migration. There is nothing to migrate. The work is designing the explicit API that replaces it, and the blast radius is one test file plus the README.

The registration internals are in better shape than the entry point. `get-attr-update.ts` already routes `$prop=${value}` on a custom element to real JS properties via `setCustomElementProps` (`get-attr-update.ts:256-284`, `350-373`), so objects, arrays, and functions pass through uncoerced; `connectedCallback` merges `this.props` with `$`-prefixed attributes and `childNodes` before mounting. That machinery is kept as-is.

## Goals / Non-Goals

**Goals:**

- An explicit `defineElement()` that registers a component as a custom element, replacing name-inference entirely.
- `component()` becomes pure — no custom-element knowledge, no side effect at definition time.
- Shadow DOM as a per-element choice, with a supported way for app styles to reach shadow-rooted content.
- Test coverage for the paths that have never had any, and documentation for a feature that has none.

**Non-Goals:**

- Registration for `SimpleComponent` (plain-function) components — see D5.
- Named slots / `[slot]` distribution in light DOM.
- SSR or hydration of custom elements (`add-server-rendering`).
- Any change to the `$`-prefixed attribute convention or to `setCustomElementProps`.
- Authoring ergonomics for composing components inside loom templates (`add-template-component-syntax`). This change is about **interop** — a non-loom page consuming `<pink-button>`.

## Decisions

### D1: `defineElement(name, templateFunction, options?)` in its own module

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
    `,
    { shadow: { mode: 'open' }, styles: [buttonSheet] }
); // + <pink-button>
```

Returns the same `Component<Props>` that `component()` returns, so the result stays directly callable in templates. Use one or the other for a given component, never both.

- **Placement:** a new `packages/core/src/define-element.ts`, exported from `index.ts`. It calls `component()` and then `registerCustomElement()`. `component.ts` drops its `./lib/templating` import (line 3) and the `registerCustomElement` call (line 118) and gains nothing.
- **Why a separate module, not a `component()` option:** an options bag on `component()` would keep `register-custom-element.ts` reachable from the module every consumer imports. A separate entry point is what makes the "apps that never call `defineElement` don't pay for it" claim true.
- **Tree-shaking caveat:** `lib/templating/index.ts` re-exports `register-custom-element`, and that barrel is imported for `getPaths`/`setUpdatesForPaths`. `define-element.ts` must import the module by path, and the barrel must stop re-exporting it, or the barrel keeps it alive. `packages/core/package.json` also has no `sideEffects` field; add `"sideEffects": false` so bundlers can actually drop it.
- **Alternative rejected:** keeping implicit registration and fixing name inference. Recorded in the proposal — `import.meta.url` resolves to core's own module, stack inspection breaks under minification, a build-time transform makes a compiler mandatory for a framework that runs from a plain `<script>`, and filenames are neither unique (`index.ts`) nor singular.

### D2: Light DOM is the default; shadow is opt-in (DECIDED by maintainer)

`registerCustomElement` currently defaults `shadowInit = { mode: 'open' }`. **Invert it:** `options.shadow` defaults to `false` (no shadow root — rendered content becomes ordinary children in the document tree, where app CSS applies normally).

These are two separate axes and both land on opt-in: `defineElement` is the opt-in to _registration_ (D1), and `options.shadow` is the opt-in to _encapsulation_ within a registered element. Choosing the first must not silently impose the second — an author who asked for `<pink-button>` asked for interop, not for their app's CSS to stop applying.

Rationale: the repo has no `adoptedStyleSheets`, `::part`, or `:host` usage anywhere. A shadow-by-default `@loom-js/pink` element renders completely unstyled, which is the worst possible first experience of the feature. Light DOM is the default that works with no additional machinery; shadow is a deliberate choice by a leaf component that owns its styling.

`mode` stays `'open'` when shadow _is_ chosen. Verified during the proposal: `open` and `closed` block document stylesheets identically — `mode` only controls whether `host.shadowRoot` is reachable from JS, so `closed` breaks tests, devtools, and external querying while buying no additional encapsulation.

### D3: Styles reach shadow content via custom properties (free) and `adoptedStyleSheets` (explicit)

Two mechanisms, in order of preference:

1. **CSS custom properties pierce the shadow boundary by inheritance.** Nothing to implement. `@loom-js/pink` sits on `@appwrite.io/pink`, which is custom-property driven, so a themed element inside a shadow root already picks up `--p-*` values from its host context. This is the answer for _theming_.
2. **`options.styles: CSSStyleSheet[]` → `shadowRoot.adoptedStyleSheets`.** For an element's own structural CSS. Core assigns the array to each shadow root it creates. Explicitly a per-root push — nothing about shadow DOM inherits stylesheets, so this is the only way component CSS gets in.

`::part` is not implemented in this change. It is additive later and requires no core support beyond authors writing `part=` in their templates, which already works.

### D4: Names are validated eagerly, with an actionable error

`registerCustomElement` stops deriving a name via `toKebabCase(templateFunction.name)` — the author supplies the literal element name, and it is used verbatim. Before calling `customElements.define`, check:

- name contains a hyphen and is a valid custom element name → otherwise throw naming the component and the offending name;
- `customElements.get(name)` is `undefined` → otherwise throw identifying the collision, since `customElements.define` throws a `NotSupportedError` whose message does not say which module registered it first.

Both replace the current silent `return`. This is what the spec's "surfaces an error rather than failing silently" scenario asks for.

### D5: `SimpleComponent` registration is cut from scope

`registerCustomElement` does `const ctxFn = componentFunction(props); ctxFn(this.ctx)` — it assumes a single `ContextFunction`. `SimpleComponent` is typed to return `ContextFunction | ContextFunction[]` (`types.ts:187-189`), which that code cannot call.

**Deferred, not solved.** The proposal notes no use case has been identified for registering a plain-function component. `defineElement` accepts a `TemplateFunction` only; its type signature excludes `SimpleComponent`, so the array case is unreachable by construction rather than unhandled. `src/simple.ts` stays deleted. If a use case appears — `@loom-js/pink` wanting `<pink-container>` — it comes back as its own change with the array-return contract designed properly.

Fragment roots (`<>…</>`) are a different thing and already work: `mount` spreads a `TemplateRootArray` into `replaceChildren(...)` (`lib/mount.ts:13-21`). They get a regression test, not an implementation.

### D6: Upgrade ordering is a documented constraint in this phase

For `$prop=${value}` to reach a JS property, the element must already be upgraded when the attribute updater runs — `getAttrUpdate`'s `default` branch tests `dynamicNode.isWebComponent` (`get-attr-update.ts:350-356`), which is only true post-upgrade. If a consuming template is parsed before the defining module has evaluated, the branch falls through to `element.setAttribute(nodeName, String(value))` and the value is silently stringified.

In a bundled app this cannot happen — all module evaluation precedes the first render. It is reachable via `lazy-import` or an unbundled `<script type="module">` graph where the consumer renders before the definition loads.

Phase 1 documents the constraint ("import the defining module before rendering a template that uses its element") rather than solving it. A `customElements.whenDefined`-aware updater is a follow-up if it bites. One small fix does land: the misleading `"${attr} must be an object literal"` warning that `setCustomElementProps` emits when `isWebComponent` is falsy (`get-attr-update.ts:272-277`) — that case is "not a registered custom element", not a bad value, and should say so.

## Risks / Trade-offs

- **Behavior change to `component()`'s public contract.** → Mitigated by the grep above: one call site in the repo, and no published consumer can be relying on it without having written `component(function Named(…))`, which is undocumented. `@loom-js/core` is `0.5.2` (pre-1.0); a minor with an explicit note in the changeset is proportionate.
- **`customElements.define` is process-global and irreversible.** A test cannot un-define an element, and a second `define` with the same name throws. → Every spec case must use a unique element name; no shared fixture element across `it` blocks.
- **Light-DOM default means no encapsulation by default.** An element's styles leak into the page and vice versa. → Accepted for phase 1, but note this runs _against_ the orthodox web-components position: if `defineElement` is for genuine third-party interop, shadow-by-default is the point — the consuming page's CSS cannot break the component and the component's CSS cannot leak into their page. Light DOM gives up both guarantees. It wins here only because core has no shadow-styling machinery yet, so shadow-by-default would render the first `defineElement` call anyone makes completely unstyled. **Revisit trigger:** real third-party consumption of a loom element, at which point `adoptedStyleSheets` (D3) is carrying real weight and the default should be reconsidered.
- **`adoptedStyleSheets` needs a `CSSStyleSheet` instance**, which authors have to construct (`new CSSStyleSheet()` + `replaceSync`, or a bundler CSS-module import). → Keep the option typed as `CSSStyleSheet[]` and show one construction example in the README rather than accepting strings and constructing sheets in core.

## Open Questions

- **RESOLVED:** Light DOM or shadow by default? → **Light DOM.** Registration and encapsulation are separate opt-ins; `defineElement` grants the first only.
- Should `defineElement` also accept `observedAttributes` so post-mount attribute changes re-render? Today `connectedCallback` reads attributes once and never observes. Out of scope for phase 1 unless interop demands it; note it in the README as a known limitation.
- Do light-DOM elements ever need multiple named regions? Named slots require shadow DOM natively; loom would have to distribute `[slot]` children itself. Deferred — the `children` prop covers the single-region case and no multi-region use case exists yet.
