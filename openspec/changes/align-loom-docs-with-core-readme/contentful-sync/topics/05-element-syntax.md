---
slug: element-syntax
title: Element Syntax
---
## Composing in markup

Components compose inside templates as elements, with props written as attributes:

```ts
html`
    <${PinkButton}
        isOnlyIcon
        icon="icon-menu"
        onClick=${() => toggleSideNav(null)}
    />
`;
```

This is **sugar over the functional form** — the template above compiles to `${PinkButton({ isOnlyIcon: true, icon: 'icon-menu', onClick: … })}` before the native parser runs, with no new runtime semantics. The two forms are interchangeable, mix freely in one template, and render identically; templates that use no component tags pass through the pipeline byte-identical. The transform runs once per template call site and is cached.

**Element syntax is the primary authoring surface.** Compose in markup — elements, attributes, children, named slots — and reserve the functional call for genuine _value positions_: an effect callback's return, a `.map` item, an `is=` prop, a props transformer — anywhere a component must travel as a JS value (with `el(tagName)` covering plain tags there). The functional form is not a legacy mode: it is the architecture the syntax compiles to (see [Components](/docs/components)), and the sanctioned escape hatch wherever a value position calls for it. Fragment-rooted values travel freely: a named-slot region or a rootless (fragment-rooted) component works both interpolated in a template and as a children-array item — the reconciler renders and moves its nodes as one group, so the two forms are equivalent.

## Props

Props come in four forms, and the prop name is always taken **verbatim** — `onClick` stays `onClick`, with no lowercasing (component tags never reach the native HTML parser):

| Form | Compiles to | Notes |
| --- | --- | --- |
| `name` | `{ name: true }` | boolean shorthand |
| `name="text"` | `{ name: 'text' }` | static string; single or double quotes; no HTML entity decoding |
| `name=${value}` | `{ name: value }` | any JS value, passed by reference — objects, arrays, functions |
| `...${object}` | `{ ...object }` | spread; JS object-spread semantics, no whitespace after `...` |

### Spread props

Spread props apply with object-literal semantics: spreads and named props land in authored order with last-wins duplicates, so `<${Header} ...${headerProps} className=${x}>` behaves exactly like `Header({ ...headerProps, className: x })`. Nullish and primitive spread values are a render-time no-op, matching `{ ...null }` in JS. A `slot` key inside a spread object arrives as an ordinary prop, never as a slot label (labels are resolved at transform time), and markup-derived `children`/`slots` still win over spread-supplied ones.

### No `$` sigil on component tags

Every attribute of a component element is a prop, so the sigil carries no information — `$` keeps its element-only meaning (`$click`, `$attrs`, `$on`, `$props` on real elements, and `$`-prefixed props on [custom elements](/docs/custom-elements)), and a `$`-prefixed prop on a component tag throws. Write `onClick=${fn}`, not `$onClick=${fn}`.

```ts
// Component tag: every attribute is a prop — no sigil.
html`
    <${PinkButton} onClick=${toggleMenu} label="Menu" />
`;

// Real element: `$` marks loom's element bindings.
html`
    <button $click=${toggleMenu} class="button">Menu</button>
`;

// Throws on first render — `$` carries no meaning on a component tag.
html`
    <${PinkButton} $onClick=${toggleMenu} label="Menu" />
`;
```

## Children

Children go between the opening tag and the single closing form, `</>`:

```ts
html`
    <${Panel} heading="Docs">
        <p>Any markup, ${interpolations}, and nested components:</p>
        <${Chip} label=${label} />
    </>
`;
```

The wrapped markup reaches the component as its `children` prop, rendering in its own component context. `</>` always closes the innermost open component tag — `</${Panel}>` and `<//>` are not accepted and throw.

## Named slots

Named slots give a component more than one labelled content region. A top-level child of the children region carrying a `slot="name"` label — a plain element or a component element — is grouped into that named region instead of `children`, and the component renders it by interpolating `slots.name`:

```ts
export const Card = component(
    (html, { children, slots }) => html`
        <article>
            <header>${slots?.header}</header>
            <div>${children}</div>
            <footer>${slots?.footer}</footer>
        </article>
    `
);

html`
    <${Card}>
        <h2 slot="header">Title</h2>
        <p>Everything unlabelled stays ordinary children.</p>
        <${Chip} slot="footer" label=${label} />
    </>
`;
```

The functional form is the same call the element syntax compiles to: `Card({ slots: { header: H2({ children: 'Title' }) }, children: … })`. Each named region renders in its own component context as a rootless fragment; an absent region simply renders nothing. Multiple same-label siblings concatenate in source order, and a distributed plain element keeps its `slot` attribute (inert in the light DOM, exactly as the platform leaves it on natively assigned nodes) — while a labelled _component_ element's `slot` prop is consumed as addressing, never forwarded.

Slot labels are recognized **only on top-level children** and must be static, non-empty, quoted strings — `slot=${name}`, `slot`, `slot=name`, and `slot=""` throw at transform time. Deeper `slot` attributes keep their native meaning and pass through untouched (e.g. children of a nested custom element distributing into its shadow DOM); loom's distribution applies to the light DOM only, and never competes with native `<slot>` distribution — a shadow-rooted custom element written as markup (`<my-el><span slot="x">…</span></my-el>`) is left entirely to the platform.

## Keys

`key` is an ordinary prop (`key=${item.id}`) and participates in keyed reconciliation exactly as `Component({ key })` does. Children of keyed items move with their parents automatically; no `key` is needed on inner component elements.

A template whose top level is only component elements (and whitespace) renders as a rootless fragment, the same as templates that start with `<>`.

## Errors

Malformed component syntax throws on the template's first render — naming the offending construct and quoting the surrounding template text — rather than falling through to the native parser and silently mis-rendering. This covers unclosed tags, unmatched `</>`, `$`-prefixed props, unquoted attribute values (`a=b`), interpolations inside quoted values (`a="x ${y}"` — use ``a=${`x ${y}`}`` instead), and `...` not immediately before an interpolation.

## Element components

Core ships a small set of kit-agnostic, tree-shakeable element components — element-level building blocks that carry real behavior (plain structure is better authored as markup):

### `RouteLink`

An anchor wired to the SPA router (see [Routing](/docs/routing)). Same-origin activations route via `route()` with no caller-supplied handler; `target="_blank"` and cross-origin hrefs fall through to the browser default (ctrl/cmd-click keeps its native new-tab behavior via the router itself).

```ts
html`
    <${RouteLink} href="/docs">Docs</>
`;
```

### `Svg`

Sprite composition. `<${Svg} path="/static/svg/sprite.svg" svgId="logo" size="20" />` renders an `<svg fill="currentColor">` whose `<use>` references `path#svgId`; `size` sets both dimensions, `height`/`width` set them individually, defaulting to `1em`.

### `Picture`

Responsive image. With a `sources` array it renders a `<picture>` containing one `<source>` per entry plus the `<img>`; without one it renders the `<img>` alone. `SourceProps` is exported for typing the entries.

### `el(tagName)`

A plain HTML tag as a component value, for the places element syntax needs an element _as a value_: polymorphic `is=` props (`is=${el('footer')}`), third-party render callbacks (`el('h2')({ children, className })`), and props transformers. Memoized per tag — `el('footer') === el('footer')` — so re-renders reuse DOM nodes; void tags (`el('img')`, `el('hr')`, …) render childless. Prefer writing markup when you can; reach for `el()` only where a component reference must travel as a JS value.
