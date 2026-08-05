---
'@loom-js/core': minor
---

Custom element registration is now explicit, via a new `defineElement()` export.

**Behavior change:** `component()` no longer registers a custom element. It previously called `registerCustomElement({ name: templateFunction.name, ... })`, deriving the element name from the render function's `.name`. That path was unreachable in practice — `registerCustomElement` bails on a falsy name, and the idiomatic form used everywhere (`component((html, props) => …)`) passes an anonymous arrow whose `.name` is `''`. Only the undocumented `component(function Named(…) {})` form ever defined an element. Nothing in this repo, `@loom-js/pink`, or `apps/loom` relied on it.

**New API:** `defineElement(name, templateFunction, options?)` is `component()` plus registration, returning the same callable `Component` so it still composes inside loom templates. Use one or the other for a given component, never both.

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

- **Encapsulation is opt-in.** A registered element renders into the **light DOM** by default, where application and design-system CSS applies normally — inverting the previous `shadowInit = { mode: 'open' }` default, which would have rendered a themed component completely unstyled. Pass `options.shadow` to encapsulate, and `options.styles` to adopt stylesheets onto the shadow root. `mode` should stay `'open'`; `'closed'` adds no style encapsulation and only makes `element.shadowRoot` unreachable.
- **Invalid and duplicate element names now throw** with a message naming the element, instead of silently returning. Names are used verbatim — the old `toKebabCase` derivation is gone.
- **`register-custom-element` is no longer reachable from every consumer.** It is dropped from the `lib/templating` barrel and imported by path from `define-element`, and `@loom-js/core` is now marked `"sideEffects": false`. Verified: an `apps/loom` build, which never calls `defineElement`, no longer emits `customElements.define`, `attachShadow`, or the element class.
- **Clearer warning** when a `$`-prefixed prop is set on a tag that is not a registered custom element (previously reported as "must be an object literal").
- **First real coverage** for the feature — 16 cases covering explicit definition, `$`-attribute→camelCase prop mapping, uncoerced object/function props from a template, children pass-through, `<>…</>` fragment roots, both light-DOM and shadow paths, and the two error cases. It is also now documented in `packages/core/README.md`, which previously said nothing about custom elements.

Registration of plain-function (`SimpleComponent`) components is intentionally out of scope — `defineElement` accepts a `TemplateFunction` only.
