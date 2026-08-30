---
slug: custom-elements
title: Custom Elements
---
## defineElement

`component()` defines a component for use inside loom templates (see [Components](/docs/components)). It does **not** define a custom element. When you want a component to be consumable from a non-loom page as `<some-element>`, define it with `defineElement()` instead — it is `component()` plus registration, and returns the same callable `Component`.

**API** `defineElement<Props>(name, templateFunction, options?)`

| Argument | Type | Description |
| --- | --- | --- |
| `name` | `string` | The custom element name. Must contain a hyphen and use no uppercase characters. |
| `templateFunction` | `TemplateFunction<Props>` | The render function, exactly as you would pass to `component()`. |
| `options.shadow` | `ShadowRootInit \| false` | Render into a shadow root. Defaults to `false` (light DOM). |
| `options.styles` | `CSSStyleSheet[]` | Stylesheets adopted by the shadow root. Ignored without `shadow`. |

**Returns** `Component` — the same callable component function, so it still composes normally inside other loom templates (via [element syntax](/docs/element-syntax) or the functional form).

```ts
import { component, defineElement } from '@loom-js/core';

// Composable in loom templates. No custom element is defined.
export const Card = component(
    (html, props) => html`
        <div>${props.children}</div>
    `
);

// Also available to any page as <pink-button>.
export const PinkButton = defineElement<ButtonProps>(
    'pink-button',
    (html, props) => html`
        <button type="${props.type}">${props.label}</button>
    `
);
```

Use one or the other for a given component, never both. An invalid or already-taken element name throws immediately, naming the element.

## Passing props from a consuming page

Consumers pass props as `$`-prefixed attributes, which map to camelCase props:

```html
<pink-button $label="Save" $type="submit"></pink-button>
```

From inside a loom template, a `$`-prefixed **interpolated** value is set as a real JS property rather than an attribute, so objects, arrays, and functions arrive uncoerced:

```ts
html`
    <pink-button $label=${label} $onClick=${handleClick}></pink-button>
`;
```

Child nodes of the host element arrive as the `children` prop.

## Light DOM vs. shadow DOM

By default a registered element renders into the **light DOM** — its content is an ordinary part of the document tree, and your application and design-system CSS applies to it with no extra work.

Pass `shadow` to encapsulate instead. Be aware that a shadow root blocks document stylesheets entirely, so a shadow-rooted component is unstyled until you supply its styles. Two mechanisms carry styles across the boundary:

1. **CSS custom properties**, which pierce the shadow boundary by inheritance. This is what makes theming work with no additional wiring.
2. **`options.styles`**, adopted onto the shadow root for the component's own CSS:

```ts
const buttonStyles = new CSSStyleSheet();

buttonStyles.replaceSync(`
    button { padding: var(--p-space-4); color: var(--p-color-text); }
`);

export const PinkButton = defineElement<ButtonProps>(
    'pink-button',
    (html, props) => html`
        <button>${props.label}</button>
    `,
    { shadow: { mode: 'open' }, styles: [buttonStyles] }
);
```

`mode` should stay `'open'`. `'closed'` provides no additional style encapsulation — it only makes `element.shadowRoot` unreachable, which breaks tests, devtools, and external queries.

> **Why light DOM is the default.** This is a deliberate call for the current release, not a rejection of encapsulation. Loom ships no styling machinery for shadow content beyond `options.styles`, so a shadow-by-default element would render completely unstyled the first time anyone reached for `defineElement`. The orthodox web-components position is the opposite — with shadow, a consuming page's CSS cannot break your component and your CSS cannot leak into their page — and it becomes the better trade once loom elements are genuinely consumed by third parties. Expect this default to be revisited then.

## Known limitations

- **Registration must happen before a consuming template is parsed.** For `$prop=${value}` to reach a JS property, the element must already be upgraded when the template renders. In a bundled app this is automatic. Under lazy loading or an unbundled module graph, import the defining module before rendering a template that uses its element — otherwise the value is silently set as a string attribute. Loom warns when it detects this.
- **Attributes are read once**, at `connectedCallback`. There is no `observedAttributes` support yet, so changing a `$`-attribute on an already-connected element does not re-render it.

Off-browser, custom elements registered via `defineElement` are applied to each injected window automatically — see [Server Rendering](/docs/server-rendering).
