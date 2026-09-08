---
slug: element-syntax
title: Element Syntax
---
Templates compose components as markup — elements, attribute props, children, named slots — and it all compiles to the functional form with no new runtime semantics. This topic covers the syntax, its rules, and the element components core ships.

## Composing in markup

Components compose inside templates as elements, with props written as attributes:

```ts
// Any loom component works here — your own, or a library's.
const MenuButton = component(
    (html) => html`
        <${IconButton}
            isOnlyIcon
            icon="icon-menu"
            onClick=${() => toggleSideNav(null)}
        />
    `
);
```

This is **sugar over the functional form** — before the native parser runs, the template above compiles to the equivalent call, with no new runtime semantics.

A template whose top level is only component elements (and whitespace) renders as a rootless fragment, the same as templates that start with `<>` — so here, with no element left to root the template, the compiler prepends the fragment prefix:

```ts
// Thus, the previous example compiles to exactly this:
const MenuButton = component(
    (html) => html`
        <>
        ${IconButton({
            isOnlyIcon: true,
            icon: 'icon-menu',
            onClick: () => toggleSideNav(null)
        })}
    `
);
```

Only component *tags* earn that inference — a lone interpolated value at the top level still needs the `<>` prefix.

When the tag sits inside a real element, no inference is needed — the call simply takes its place and the root is untouched:

```ts
const Menu = component(
    (html) => html`
        <nav>
            <${IconButton} icon="icon-menu" onClick=${toggleMenu} />
        </nav>
    `
);

// compiles to:
const Menu = component(
    (html) => html`
        <nav>
            ${IconButton({ icon: 'icon-menu', onClick: toggleMenu })}
        </nav>
    `
);
```

The two forms mix freely in one template and render identically. The compile step is cheap where it matters: templates with no component tags pass through byte-identical, and the transform runs once per template call site and is cached.

## Markup vs. the functional form

So which form goes where? **Element syntax is the primary authoring surface** — compose in markup: elements, attributes, children, named slots. Reserve the functional call for genuine _value positions_, where a component must travel as a JS value. A `.map` item:

```ts
const TodoList = component(
    (html, { items }) => html`
        <ul>
            ${items.map((item) =>
                ListItem({ key: item.id, label: item.label })
            )}
        </ul>
    `
);
```

An effect callback's return:

```ts
const Main = component(
    (html) => html`
        <main>
            ${page.effect(({ value: topic }) =>
                topic ? TopicView({ topic }) : Loading()
            )}
        </main>
    `
);
```

An `is=` prop — a polymorphic root takes its component as a value, with `el(tagName)` covering plain tags:

```ts
const DocsCard = component(
    (html) => html`
        <${Card} is=${el('article')} heading="Docs">
            <p>The card renders an article root.</p>
        </>
    `
);
```

The functional form is not a legacy mode — it is exactly the compiled call shown above. Fragment-rooted components travel the same way anywhere a value goes: interpolated or in a children array, the reconciler moves their nodes as one group.

## Props

Props come in four forms, and the prop name is always taken **verbatim** — `onClick` stays `onClick`, with no lowercasing (component tags never reach the native HTML parser):

| Form | Compiles to | Notes |
| --- | --- | --- |
| `name` | `{ name: true }` | boolean shorthand |
| `name="text"` | `{ name: 'text' }` | static string; single or double quotes; no HTML entity decoding |
| `name=${value}` | `{ name: value }` | any JS value, passed by reference — objects, arrays, functions |
| `...${object}` | `{ ...object }` | spread; JS object-spread semantics, no whitespace after `...` |

### Spread props

Spread props apply with object-literal semantics: spreads and named props land in authored order with last-wins duplicates —

```ts
const headerProps = { className: 'header', id: 'top' };

// `className` lands after the spread, so it wins — exactly like
// `Header({ ...headerProps, className: 'hero' })`.
const PageHeader = component(
    (html) => html`
        <${Header} ...${headerProps} className="hero" />
    `
);
// => Header receives { className: 'hero', id: 'top' }
```

Nullish and primitive spread values are a render-time no-op, matching `{ ...null }` in JS:

```ts
// Renders as if the spread weren't there.
const PageHeader = component(
    (html, { maybeProps }) => html`
        <${Header} ...${maybeProps ?? null} id="top" />
    `
);
```

A `slot` key inside a spread object arrives as an ordinary prop, never as a slot label (labels are resolved at transform time), and markup-derived `children`/`slots` still win over spread-supplied ones:

```ts
// `slot` stays a plain prop, and the markup children win over
// `spread.children`.
const spread = { children: 'ignored', slot: 'header' };

const SpreadCard = component(
    (html) => html`
        <${Card} ...${spread}>
            <p>These children win.</p>
        </>
    `
);
```

### No `$` sigil on component tags

On a component tag, write `onClick=${fn}` — never `$onClick=${fn}`. The `$` sigil belongs to real elements, where it marks the renderer's own bindings — `$click`, `$attrs`, `$on`, `$props` — and to the `$`-prefixed attributes of [custom elements](/docs/custom-elements). A component element needs no marker: every attribute is already a prop, so a `$`-prefixed prop there carries no meaning, and throws.

```ts
// Component tag: every attribute is a prop — no sigil.
const MenuTag = component(
    (html) => html`
        <${IconButton} onClick=${toggleMenu} label="Menu" />
    `
);

// Real element: `$` marks loom's element bindings.
const MenuElement = component(
    (html) => html`
        <button $click=${toggleMenu} class="button">Menu</button>
    `
);

// Throws on first render — `$` carries no meaning on a component tag.
component(
    (html) => html`
        <${IconButton} $onClick=${toggleMenu} label="Menu" />
    `
);
```

The split carries real information. `$click` on a real element tells the renderer to attach a listener to *that* node; `onClick` on a component is a plain value whose meaning the component owns — it may bind it to an inner element, wrap it, or never touch the DOM:

```ts
// The same prop, two owners' meanings: bound to an inner element…
const Chip = component(
    (html, { label, onClick }) => html`
        <button $click=${onClick} type="button">${label}</button>
    `
);

// …or wrapped, so the component decides when — or whether — it fires.
const ConfirmChip = simple(({ label, onClick }) =>
    Chip({
        label,
        onClick: (event) => confirm('Are you sure?') && onClick?.(event)
    })
);
```

There is no general answer to which node a component-level `$click` would target — a fragment root has none; a card's button may sit levels deep — so the sigil stays where the target is certain.

In practice the hookup is still nearly free: components built over `el()` — core's element components included — forward `onClick` to their element automatically:

```ts
// `el()` maps `onClick` to `$click` on the element it renders — no wiring.
const SaveButton = simple(({ onClick }) =>
    el('button')({ children: 'Save', onClick })
);
```

Those are the prop rules end to end. Content flows differently — through children.

### The `key` prop

`key` is an ordinary prop (`key=${item.id}`) and participates in keyed reconciliation exactly as `Component({ key })` does:

```ts
const todos = activity<Todo[]>([]);

const TodoList = component(
    (html) => html`
        <ul>
            ${todos.effect(({ value: items }) =>
                items.map((item) =>
                    TodoItem({ key: item.id, label: item.label })
                )
            )}
        </ul>
    `
);
```

Keys are what make reordering cheap and safe: on an update, a keyed item's rendered nodes are *moved*, not rebuilt — node identity survives, so an item's input value, focus, or scroll position rides along with it. Without keys, a reorder re-renders items in place instead.

Children of keyed items move with their parents automatically; no `key` is needed on inner component elements — and a keyed *fragment-rooted* item moves as one group, every top-level node relocating together.

## Children

Children go between the opening tag and the single closing form, `</>`:

```ts
const DocsPanel = component(
    (html, { interpolations, label }) => html`
        <${Panel} heading="Docs">
            <p>Any markup, ${interpolations}, and nested components:</p>
            <${Chip} label=${label} />
        </>
    `
);
```

The wrapped markup reaches the component as its `children` prop, rendering in its own component context. `</>` always closes the innermost open component tag — `</${Panel}>` (the JSX-style guess) and `<//>` (htm's closing form) are not accepted and throw, naming the fix.

## Named slots

Named slots give a component more than one labelled content region — `children`, plus any number of named regions the component places wherever it likes. The contract has two sides.

The component's side: alongside `children`, its props carry a `slots` object with one key per region name. Interpolating `slots.name` decides where that region renders:

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
```

The caller's side: a top-level child carrying a `slot="name"` label — a plain element or a component element — is grouped into `slots.name` instead of `children`:

```ts
const TitledCard = component(
    (html, { label }) => html`
        <${Card}>
            <h2 slot="header">Title</h2>
            <p>Everything unlabelled stays ordinary children.</p>
            <${Chip} slot="footer" label=${label} />
        </>
    `
);
```

The functional form is the same call the element syntax compiles to:

```ts
Card({
    slots: {
        footer: Chip({ label }),
        header: el('h2')({ children: 'Title' })
    },
    children: el('p')({
        children: 'Everything unlabelled stays ordinary children.'
    })
});
```

A named region arrives with no wrapper element: interpolating it drops the labeled nodes in place as bare siblings, and the region renders as its own unit — its nodes reconcile and move together, like any fragment. An absent region simply renders nothing. Multiple same-label siblings concatenate in source order.

The label itself leaves different traces. A plain element keeps its `slot` attribute in the rendered DOM — inert, exactly as the platform leaves it on natively assigned nodes. On a component element, `slot` exists only to name the region its content belongs to — consumed at transform time, never reaching the component as a prop:

```ts
const FooterCard = component(
    (html, { label }) => html`
        <${Card}>
            <!-- Same label: both land in slots.footer, in source order. -->
            <a slot="footer" href="/docs">Docs</a>
            <a slot="footer" href="/about">About</a>
            <!-- Plain element: the rendered <a> keeps slot="footer". -->
            <!-- Component element: \`slot\` is consumed at transform time — Chip never sees it. -->
            <${Chip} slot="footer" label=${label} />
        </>
    `
);
```

Slot labels are recognized **only on top-level children** and must be static, non-empty, quoted strings:

```ts
// Each throws at transform time — labels resolve before render:
component((html) => html`<${Card}><p slot=${name}>…</p></>`); // interpolated
component((html) => html`<${Card}><p slot>…</p></>`); // bare
component((html) => html`<${Card}><p slot=name>…</p></>`); // unquoted
component((html) => html`<${Card}><p slot="">…</p></>`); // empty
```

Deeper `slot` attributes keep their native meaning and pass through untouched; loom's distribution applies to the light DOM only, and never competes with native `<slot>` distribution — a shadow-rooted custom element written as markup is left entirely to the platform:

```ts
const MixedCard = component(
    (html) => html`
        <${Card}>
            <!-- Top level: loom's label — lands in slots.header. -->
            <h2 slot="header">Title</h2>
            <!-- Nested inside a custom element: the platform's slot,
                distributing into my-el's shadow DOM. Loom passes it
                through. -->
            <my-el>
                <span slot="x">Shadow-distributed by the browser.</span>
            </my-el>
        </>
    `
);
```

## Errors

Malformed component syntax throws on the template's first render — naming the offending construct and quoting the surrounding template text — rather than falling through to the native parser and silently mis-rendering. This covers unclosed tags, unmatched `</>`, `$`-prefixed props, unquoted attribute values (`a=b`), interpolations inside quoted values (`a="x ${y}"` — use ``a=${`x ${y}`}`` instead), and `...` not immediately before an interpolation.

## Template comments

HTML comments (`<!-- … -->`) are the way to annotate a template — they work anywhere, component tags' children regions included, and become real `Comment` nodes, present in the rendered DOM and in server output. One character needs care: a backtick inside a template — comments included — belongs to the template literal, so escape it (`\``) and it arrives as a literal backtick. For the rare annotation that should leave no trace in the DOM at all, interpolate an empty string with a JS comment beside it — `${'' /* … */}` renders nothing:

```ts
const Annotated = component(
    (html, { content }) => html`
        <div>
            <!-- A real comment node — visible in the DOM & server markup. -->
            ${'' /* Renders nothing: the value is '', the JS comment is free. */}
            ${content}
        </div>
    `
);
```

## Element components

Core ships a small set of kit-agnostic, tree-shakeable element components — element-level building blocks that carry real behavior (plain structure is better authored as markup):

### `RouteLink`

An anchor wired to the SPA router (see [Routing](/docs/routing)). Same-origin activations route via `route()` with no caller-supplied handler; `target="_blank"` and cross-origin hrefs fall through to the browser default (ctrl/cmd-click keeps its native new-tab behavior via the router itself).

```ts
const DocsLink = component(
    (html) => html`
        <${RouteLink} href="/docs">Docs</>
    `
);
```

### `Svg`

Sprite composition: renders an `<svg fill="currentColor">` whose `<use>` references `path#svgId`. `size` sets both dimensions; `height`/`width` set them individually, defaulting to `1em`.

```ts
const HomeButton = component(
    (html) => html`
        <button $click=${route} type="button">
            <${Svg} path="/static/svg/sprite.svg" svgId="logo" size="20" />
            Home
        </button>
    `
);
```

### `Picture`

Responsive image. With a `sources` array it renders a `<picture>` containing one `<source>` per entry plus the `<img>`; without one it renders the `<img>` alone. `SourceProps` is exported for typing the entries.

```ts
import { component, Picture, type SourceProps } from '@loom-js/core';

const sources: SourceProps[] = [
    { media: '(width >= 768px)', srcset: '/img/hero-wide.avif' },
    { srcset: '/img/hero.avif' }
];

// With sources: <picture> wrapping one <source> per entry + the <img>.
const Hero = component(
    (html) => html`
        <${Picture}
            alt="Sunrise over the loom"
            loading="lazy"
            sources=${sources}
            src="/img/hero.jpg"
        />
    `
);

// Without: just the <img>.
const HeroPlain = component(
    (html) => html`
        <${Picture} alt="Sunrise over the loom" src="/img/hero.jpg" />
    `
);
```

### `el(tagName)`

A plain HTML tag as a component value, for the places element syntax needs an element _as a value_ — polymorphic `is=` props, third-party render callbacks, props transformers.

```ts
// A polymorphic root: the card renders a <section> this time.
const DocsSection = component(
    (html) => html`
        <${Card} is=${el('section')} heading="Docs">
            <p>Card content.</p>
        </>
    `
);

// An API that asks *you* for a component value — here a `heading` prop —
// gets a plain tag the same way it would get any component:
const Section = component<{ heading: ContextFunction }>(
    (html, { children, heading }) => html`
        <section>
            <header>${heading}</header>
            ${children}
        </section>
    `
);

const ReleaseNotes = component(
    (html) => html`
        <${Section}
            heading=${el('h2')({
                children: 'Releases',
                className: 'heading-level-4'
            })}
        >
            <p>Everything in the latest release.</p>
        </>
    `
);
```

Memoized per tag, so re-renders reuse DOM nodes:

```ts
el('footer') === el('footer'); // => true — one component per tag name
```

Void tags — self-closing elements that can't take children — render childless:

```ts
const Divider = component(
    (html) => html`
        <div>
            ${el('hr')({ className: 'divider' })}
            ${el('img')({ attrs: { alt: 'Logo', src: '/img/logo.png' } })}
        </div>
    `
);
```

Prefer writing markup when you can; reach for `el()` only where a component reference must travel as a JS value — the same test that picks the functional form:

```ts
// The tag travels as data: which element renders is decided by a value.
const statusTag = { error: el('strong'), info: el('span') };

const StatusLine = component(
    (html, { level, message }) => html`
        <p>${statusTag[level]({ children: message })}</p>
    `
);
```
