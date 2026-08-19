<h1 align="center">
  <img width="140" height="140" src="https://github.com/darkkenergy/loomjs/blob/main/packages/core/assets/img/loom-logo.png">
  <div>loomjs</div>
</h1>

> A reactive components-first JavaScript framework.

## Feature Highlights

- **Micro-updates** on rerenders - updates are made at the attribute & node-levels.
- **Self-cleanup** leveraging native JS garbage collection & `Weakmap` to release dead nodes from memory.
- **Reactivity** to rerender any number of components used within a component template.
- **Tagged Templates** for performant processing of component templates.
- **Client-side Routing** for dynamic rendering of components based on `Location` data.
- **Support for Lazy-loading** of routes.
- **Server rendering** (`@loom-js/core/server`) - render to an HTML string for SSR & SSG through the same code path the browser runs.
- **Client hydration** (`hydrate`) - invisible takeover of pre-rendered pages: one atomic swap once the app has settled, no content flashes.
- **Dehydrated state** (`resource` → `dehydrate` → `primeResources`) - hand the server's fetched data to the client, so a primed hydration never refetches.
- **0 Dependencies** (you're welcome)
- **Typescript Types** included.

## Install

```bash
npm i @loom-js/core -S
```

```bash
yarn add @loom-js/core
```

## Inclusion

```ts
import * as Loom from '@loom-js/core';
```

## Concepts

### Bootstrapping your application

The app is where you first introduce your component ecosystem (one or more components that will drive your application). Bootstrapping is the process where you create and configure your app.

**API** `init(options)`

**Inclusion** `import { init } from '@loom-js/core';`

**Arguments**

- interface `AppInitProps` = `{ app: (ctx?: ComponentContext) => Node; onAppMounted?: (mountedApp: Node) => any; root: HTMLElement; }`

    - `app` - A `ContextFunction` which returns a single node (the app node) that will contain all other nodes from your app's component ecosystem, and it will eventually be appended to the app's root node once the initial render is complete.

    - `onAppMounted` - A callback function which gets called once the app node is appended to the desired DOM root node.

    - `root` - A DOM node which the app node is appended to once the initial render is complete.

**Quick Example**

```ts
import { init } from '@loom-js/core';
import { App } from './app';
init({
    app: App(),
    onAppMounted: (app) => {
        console.log(document.contains(app));
        // => true
    }
    root: document.body
});
```

### Components

A component uses a "tagged template" (w/ [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax) - the template render function - to define its template.

Use `component` to register a template render function. It takes a render function as its argument, passing Loom's template renderer to the render function along with some props, and a getter for the component's rendered node. A template context is bound to the renderer to achieve optimal rerenders.

When using `component`, the tagged template's template string must contain only one element opening & closing tag at the start & end of the template string and must belong to the same element.

**API** `component<T>(template)`

**Inclusion** `import { component } from '@loom-js/core';`

**Arguments**

- interface `RenderFunction` = `{ (render, props) => Node }`

    - `render` (can be named anything) - the template render function ("tagged template") with the bound context.

        - Initializes a component template.
        - Once initialized, it efficiently handles updates to the same component using the bound context.

        **Arguments**

        - type `TemplateLiteral` = `` `my template literal` ``
            - **Note** - The template literal must contain only one top-level node, of the `Element` type.

        **Returns** `Node`

    - `props` (can be named anything or destructured) - an object literal containing dynamic property values for enriching your component, along with a getter, `node()`, which returns the component's rendered node, and two life-cycle methods: `onCreated(handler)` & `onRendered(handler)` - all life-cycle methods take a handler callback, and that handler receives the component's rendered node as an argument (see the section "Life Cycles" under "Examples" > "Components".)

**Returns** `Component` The callable component function.

**Quick Example**

```ts
import { component } from '@loom-js/core';

interface ButtonProps {
    label: string;
    type: string;
}
export const Button = component<ButtonProps>(
    (html, props) => html`
        <button type="${props.type}">${props.label}</button>
    `
);
```

**Attribute & text values.** An interpolated attribute value on a plain element is applied when truthy & **removed when falsy** — that one rule gives you boolean attributes (`disabled=${isDisabled}`) and conditional attributes (`aria-label=${labelOrUndefined}`) for free. The number `0` is the deliberate exception: it is a real value, so `tabindex=${0}`, `min=${0}`, and a `$attrs` entry of `0` render as `"0"` (and `value=${0}` sets the element's value property). Text slots follow the same shape — `${0}` renders `0`, while `undefined`/`null`/`false` render as empty text.

### Composing components (element syntax)

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

**Element syntax is the primary authoring surface.** Compose in markup — elements, attributes, children, named slots — and reserve the functional call for genuine _value positions_: an effect callback's return, a `.map` item, an `is=` prop, a props transformer — anywhere a component must travel as a JS value (with `el(tagName)` covering plain tags there). The functional form is not a legacy mode: it is the architecture the syntax compiles to, and the sanctioned escape hatch wherever a value position calls for it. Fragment-rooted values travel freely: a named-slot region or a rootless (fragment-rooted) component works both interpolated in a template and as a children-array item — the reconciler renders and moves its nodes as one group, so the two forms are equivalent.

**Props** come in four forms, and the prop name is always taken **verbatim** — `onClick` stays `onClick`, with no lowercasing (component tags never reach the native HTML parser):

| Form            | Compiles to        | Notes                                                           |
| --------------- | ------------------ | --------------------------------------------------------------- |
| `name`          | `{ name: true }`   | boolean shorthand                                               |
| `name="text"`   | `{ name: 'text' }` | static string; single or double quotes; no HTML entity decoding |
| `name=${value}` | `{ name: value }`  | any JS value, passed by reference — objects, arrays, functions  |
| `...${object}`  | `{ ...object }`    | spread; JS object-spread semantics, no whitespace after `...`   |

**Spread props** apply with object-literal semantics: spreads and named props land in authored order with last-wins duplicates, so `<${Header} ...${headerProps} className=${x}>` behaves exactly like `Header({ ...headerProps, className: x })`. Nullish and primitive spread values are a render-time no-op, matching `{ ...null }` in JS. A `slot` key inside a spread object arrives as an ordinary prop, never as a slot label (labels are resolved at transform time), and markup-derived `children`/`slots` still win over spread-supplied ones.

**No `$` sigil on component tags.** Every attribute of a component element is a prop, so the sigil carries no information — `$` keeps its element-only meaning (`$click`, `$attrs`, `$on`, `$props` on real elements), and a `$`-prefixed prop on a component tag throws. Write `onClick=${fn}`, not `$onClick=${fn}`.

**Children** go between the opening tag and the single closing form, `</>`:

```ts
html`
    <${Panel} heading="Docs">
        <p>Any markup, ${interpolations}, and nested components:</p>
        <${Chip} label=${label} />
    </>
`;
```

The wrapped markup reaches the component as its `children` prop, rendering in its own component context. `</>` always closes the innermost open component tag — `</${Panel}>` and `<//>` are not accepted and throw.

**Named slots** give a component more than one labelled content region. A top-level child of the children region carrying a `slot="name"` label — a plain element or a component element — is grouped into that named region instead of `children`, and the component renders it by interpolating `slots.name`:

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

**`key`** is an ordinary prop (`key=${item.id}`) and participates in keyed reconciliation exactly as `Component({ key })` does. Children of keyed items move with their parents automatically; no `key` is needed on inner component elements.

A template whose top level is only component elements (and whitespace) renders as a rootless fragment, the same as templates that start with `<>`.

**Errors.** Malformed component syntax throws on the template's first render — naming the offending construct and quoting the surrounding template text — rather than falling through to the native parser and silently mis-rendering. This covers unclosed tags, unmatched `</>`, `$`-prefixed props, unquoted attribute values (`a=b`), interpolations inside quoted values (`a="x ${y}"` — use ``a=${`x ${y}`}`` instead), and `...` not immediately before an interpolation.

### Element components

Core ships a small set of kit-agnostic, tree-shakeable element components — element-level building blocks that carry real behavior (plain structure is better authored as markup):

**`RouteLink`** — an anchor wired to the SPA router. Same-origin activations route via `route()` with no caller-supplied handler; `target="_blank"` and cross-origin hrefs fall through to the browser default (ctrl/cmd-click keeps its native new-tab behavior via the router itself).

```ts
html`
    <${RouteLink} href="/docs">Docs</>
`;
```

**`Svg`** — sprite composition. `<${Svg} path="/static/svg/sprite.svg" svgId="logo" size="20" />` renders an `<svg fill="currentColor">` whose `<use>` references `path#svgId`; `size` sets both dimensions, `height`/`width` set them individually, defaulting to `1em`.

**`Picture`** — responsive image. With a `sources` array it renders a `<picture>` containing one `<source>` per entry plus the `<img>`; without one it renders the `<img>` alone. `SourceProps` is exported for typing the entries.

**`el(tagName)`** — a plain HTML tag as a component value, for the places element syntax needs an element _as a value_: polymorphic `is=` props (`is=${el('footer')}`), third-party render callbacks (`el('h2')({ children, className })`), and props transformers. Memoized per tag — `el('footer') === el('footer')` — so re-renders reuse DOM nodes; void tags (`el('img')`, `el('hr')`, …) render childless. Prefer writing markup when you can; reach for `el()` only where a component reference must travel as a JS value.

### Custom elements

`component()` defines a component for use inside loom templates. It does **not** define a custom element. When you want a component to be consumable from a non-loom page as `<some-element>`, define it with `defineElement()` instead — it is `component()` plus registration, and returns the same callable `Component`.

**API** `defineElement<Props>(name, templateFunction, options?)`

| Argument           | Type                      | Description                                                                     |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| `name`             | `string`                  | The custom element name. Must contain a hyphen and use no uppercase characters. |
| `templateFunction` | `TemplateFunction<Props>` | The render function, exactly as you would pass to `component()`.                |
| `options.shadow`   | `ShadowRootInit \| false` | Render into a shadow root. Defaults to `false` (light DOM).                     |
| `options.styles`   | `CSSStyleSheet[]`         | Stylesheets adopted by the shadow root. Ignored without `shadow`.               |

**Returns** `Component` — the same callable component function, so it still composes normally inside other loom templates.

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

#### Passing props from a consuming page

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

#### Light DOM vs. shadow DOM

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

#### Known limitations

- **Registration must happen before a consuming template is parsed.** For `$prop=${value}` to reach a JS property, the element must already be upgraded when the template renders. In a bundled app this is automatic. Under lazy loading or an unbundled module graph, import the defining module before rendering a template that uses its element — otherwise the value is silently set as a string attribute. Loom warns when it detects this.
- **Attributes are read once**, at `connectedCallback`. There is no `observedAttributes` support yet, so changing a `$`-attribute on an already-connected element does not re-render it.

### Activities (reactivity)

An activity uses a pub/sub pattern at its core. This concept directly supports reactive behavior within your component ecosystem.

When creating a new activity, you may provide a default value. One or more effects may be queued within your component ecosystem for any given activity. Then, by hooking an activity update to some event, all subscribed effects will be called in order of "first-in, first-out".

**API** `activity<T>(initialValue)`

**Inclusion** `import { activity } from '@loom-js/core';`

**Arguments**

- `initialValue` - any type of value which is unchanged throughout the life of the activity.

**Returns** `{ effect: ActivityEffect<T = any>; update(newValue: T): void; value(): T; }`

- **Interface**

    _Properties_

    - `initialValue`
        - Any type of value which is unchanged throughout the life of the activity.

    _Methods_

    - `effect(({ value }) => (ctx?: ComponentContext) => Node)`
        - An effect is called at least once per use, when it's first introducted during the component render process. Additionally, it's called once per activity update.
        - `value` - the initial activity value, or the new value on updates.
    - `bind(select?)`
        - Creates a reactive attribute binding for template attr slots — the bound attribute applies `select` of the current value immediately and stays in sync with every update, **without re-rendering the component**. Cleanup is automatic: the binding is disposed when a re-render replaces the slot's value and on unmount.
        - `select` - projects the activity value to the attribute value; defaults to identity.
        - Prefer `bind` over an `effect` boundary when only an attribute depends on the activity; prefer `effect` when content or structure changes.
    - `update(newValue)`
        - Calling this method will trigger all subscribed effects from the related activity, passing the new value to each effect.
    - `value()`
        - A getter which always returns the current value, which is initially `initialValue`.
    - `watch(action)`
        - Subscribes a caller-managed handler: `action` runs immediately with the current value, then on every update.
        - Returns an `Unsubscriber` — cleanup is the caller's responsibility (e.g. pair it with `onUnmounted`), unlike `effect` (context-managed) and `bind` (template-managed).

**Attribute binding example**

```ts
import { activity, component } from '@loom-js/core';

const isOpen = activity(false);

const Panel = component(
    (html) => html`
        <section
            class=${isOpen.bind((open) => (open ? 'panel _open' : 'panel'))}
        >
            Content is untouched when the class updates.
        </section>
    `
);
```

**Quick Example**

```ts
import { activity } from '@loom-js/core';

const initialValue = 0;
export const buttonClickActivity = activity(initialValue);
console.log(buttonClickActivity.initialValue); /* => 0 */

console.log(buttonClickActivity.value()); /* => 0 */
buttonClickActivity.update(1);
console.log(buttonClickActivity.initialValue); /* => 0 */
console.log(buttonClickActivity.value()); /* => 1 */
```

See the Activity Example, below, for an `effect()` usage example.

### Routing

Routing is used specifically for single-page-apps (SPA). You can still set up server-side routes as you would for a multi-page app, and then let the client-side routing take over to achieve a snappy single-page-app experience. This approach would also work well when prerending a static site or JAMStack architecture.

The routing system is one layered pipeline per window, built on the activity system and the browser's native History API. Every navigation flows through a raw **location** layer (always fires, no configuration needed), whose match transform feeds the **route** layer (fires when a registered route matches):

- **Layer 1 — location**: zero-config reactivity to the raw `Location` — `locationEffect`, `watchLocation`.
- **Layer 2 — routes**: route-table matching with lazy-loaded pages — `createRoutes`, `routeEffect`, `watchRoute`.

In the browser there is exactly one router for the lifetime of the page; on a server each injected window resolves its own isolated instance (see Server rendering).

**API**

- `createRoutes({ config, fallback })` - Registers the app's route table & returns the routes component to compose into your layout tree. Each `config` entry maps a route path (dynamic segments via `/:param`) to an importer of the page component — `() => import('@app/pages/about')`, matched on the module's default export.
    - DOM-free at call time: calling it at module scope is safe in any runtime, including off-browser. History wiring defers to first use inside a DOM scope.
    - Calling it again replaces the route table — last call wins.
    - `fallback?: () => Promise<ContextFunction | undefined>` - Rendered while no page has loaded.
- `route(event, options?)` - The click-handler for SPA navigation; wraps `history.pushState`. Modified activations (ctrl/cmd/shift/alt-click) & events another handler already consumed fall through to the browser.
    - `event` - Pass the click event through (`route` directly as the handler, or `(e) => route(e, options)`); pass `null` when navigating programmatically via `options.href`.
    - `options`
        - `href?: string` - The target url - overrides the anchor's href attribute.
        - `replace?: boolean` - Uses `replaceState` so the address bar updates without adding a history entry.
- `routeEffect(routeEffectCallback)` - An effect over the matched route. The callback receives `{ value: RouteValue }` — `matchedRoute`, `params`, `pathname` & `raw` (the `Location`) — & must return a `ContextFunction`. Requires a registered route table.
- `watchRoute(handler)` - The non-rendering watcher form of `routeEffect`; returns an unsubscriber.
- `locationEffect(locationEffectCallback)` - An effect over the raw `Location`. Zero-config — no route table required — & re-runs on every navigation. The callback receives `{ value: Location }` & must return a `ContextFunction`.
- `watchLocation(handler)` - The non-rendering watcher form of `locationEffect`; returns an unsubscriber.
- `redirect(href)` - Programmatic replace-state navigation.
- `RouteLink` - A pre-wired SPA anchor — see Element Components.

**Inclusion** `import { createRoutes, locationEffect, route } from '@loom-js/core';`

**Quick Example**

```ts
import { RouteLink, component, createRoutes } from '@loom-js/core';

// Module scope is fine — registration is DOM-free.
const Routes = createRoutes({
    config: {
        '/': () => import('@app/pages/home'),
        '/docs/:slug': () => import('@app/pages/docs')
    }
});

export const App = component(
    (html, props) => html`
        <div>
            <nav>
                ${RouteLink({ children: 'Home', href: '/' })}
                ${RouteLink({ children: 'Docs', href: '/docs/intro' })}
            </nav>
            <main>${Routes(props)}</main>
        </div>
    `
);
```

Pages receive the matched route as `routeProps` (a `RouteValue`) — e.g. `/docs/:slug` exposes `routeProps.params.slug`.

**Hash / anchor navigation.** `route()` restores the native anchor jump its `preventDefault` suppresses, scrolling the element whose `id` matches the url's `#fragment` into view (a bare trailing `#` scrolls to the top):

- **Same-page** (`#fragment`-only navigation): scrolls immediately. The activity pipeline stays quiet — no location or route emission, no page reload.
- **Cross-page** (navigation with a fragment that changes the route): the fragment is held until the routed page content renders, then scrolled.
- **Initial load** (app boots on a url carrying a fragment): the browser's native scroll fired before lazily-imported content existed, so the router scrolls after the first routed render.

The deferred scroll is a **single attempt** — if the target `id` doesn't exist once the routed content has rendered (e.g. the page renders its anchors asynchronously after mount), nothing scrolls and the app owns its own scroll from there. A subsequent navigation drops any unconsumed fragment. Scrolling uses `scrollIntoView()`, so the page's `scroll-behavior` CSS controls smoothness.

When you want to react to the url without a route table — a breadcrumb, an analytics hook, a tiny app that switches on `pathname` — use layer 1 directly:

```ts
import { component, locationEffect, route } from '@loom-js/core';

import { About, Home, NotFound } from '@app/component/pages';

export const App = component<unknown>(
    (html) => html`
        <div>
            <nav>
                <a $click="${route}" href="/">Home</a>
                |
                <a $click="${route}" href="/about">About</a>
            </nav>
            <main>
                ${locationEffect(({ value: { pathname } }) => {
                    switch (pathname) {
                        case '/':
                            return Home();
                        case '/about':
                            return About();
                        default:
                            return NotFound();
                    }
                })}
            </main>
        </div>
    `
);
```

### Server rendering (SSR & SSG)

`renderToString` renders an app to an HTML string outside the browser — at request time (SSR) or build time (SSG/prerender). It runs the **exact same render path** the client does, against an injected DOM implementation, so server and client markup cannot drift. loom never imports the DOM implementation itself; you supply a window (we recommend [linkedom](https://github.com/WebReflection/linkedom) — small, fast, purpose-built for this).

**API**

- `renderToString(app: ContextFunction, options)` - The go-to render (async). Renders `app` against the injected DOM, drains settled route/lazy-import work — so `createRoutes` route pages & `lazyImport` content serialize in place — & resolves the document body's `innerHTML`. Concurrent calls are safely serialized internally.
    - `options`
        - `window` - The DOM to render against, e.g. `parseHTML(...).window` from linkedom. Use a fresh window per render — never share one across concurrent renders.
        - `url?: string` - The request URL. Installed as the window's `location`, so `locationEffect` & `createRoutes` match the requested path.
- `renderToStringSync(app: ContextFunction, options)` - The synchronous primitive: whatever has rendered when the app's synchronous work completes is what serializes (the naming follows Node's `readFile`/`readFileSync` pairing). Right for route-less renders — fragments, email/OG markup, component snapshot tests. A route-table app serializes only its shell/fallback here, since page importers cannot settle inside a synchronous pass. Same `options`.

**Inclusion** `import { renderToString } from '@loom-js/core/server';`

**Quick Example**

```ts
import { renderToString } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import { App } from '@app/app';

// One window per render (per request, or per page when prerendering).
const { window } = parseHTML('<html><body></body></html>');
const markup = await renderToString(App(), {
    url: request.url,
    window
});

// Inject the markup into your HTML shell however you like.
const html = shellTemplate.replace('<!--app-->', markup);
```

**Semantics worth knowing**

- `renderToString` settles what the app itself scheduled (route pages, lazy imports) & then serializes; `renderToStringSync` serializes only what settled synchronously. Post-render async updates beyond that belong to the client — boot it with `hydrate` (see Client hydration) to make the takeover invisible.
- `onCreated`, `onBeforeRender` & `onRendered` fire as usual; `onMounted` & `onUnmounted` never fire on the server — they describe a live, observed browser document.
- Custom elements registered via `defineElement` are applied to each injected window automatically.
- Importing `@loom-js/core` off-browser is safe - browser-coupled state (router location, history listeners) initializes lazily on first use.
- Nothing extra ships to the browser: the server entry is a separate export, & linkedom is your dependency, not loom's.

### Client hydration

`renderToString` → `hydrate` is the pre-rendering story: the server (or build step) serializes the page, & `hydrate` boots the client on top of it **without ever showing a flash**. Where `init` wipes the root to the app shell immediately (then churns again as lazy routes & data land), `hydrate` leaves the pre-rendered DOM untouched while the app renders detached, & performs a **single atomic swap** once the app has _settled_ — lazy route content & async activity work included. Because server & client run the same render path, the swapped-in DOM matches the served markup & the takeover is invisible.

**API**

- `hydrate(props): Promise<void>` - `init`'s contract minus `append` (the swap is always a full replace); resolves after the swap & `onAppMounted`.
    - `props`
        - `app`, `root`, `globalConfig`, `onAppMounted` - As in `init`.
        - `ready?: Promise<unknown>` - Optional caller-owned gate: the swap awaits it alongside settlement. Use it for async work the framework cannot track (see the tracking boundary below).
        - `maxWait?: number` - Upper bound in ms (default `4000`) on how long the swap waits. On expiry the swap runs with whatever has rendered & a `loom.console` warning names the still-pending count. `Infinity` disables the bound.
- `settled(): Promise<void>` - The signal `hydrate` gates on, exported on its own: resolves once no framework-mediated async work is pending for the current window, confirmed by one macrotask of continued quiet (so chained lazy work is awaited to quiescence). Useful as a test await point or anywhere "the app is done booting" matters.

**Quick Example**

```ts
import { hydrate } from '@loom-js/core';

import { App } from '@app/app';

// The root already carries the server-rendered markup.
hydrate({
    app: App(),
    root: document.querySelector('#page-content')
});
```

**Semantics worth knowing**

- **The tracking boundary:** settlement counts every thenable returned by an activity transform — lazy imports, `createRoutes` page imports, async data transforms. That's the idiomatic data path, & it's tracked end-to-end. Async work that never passes through a transform (a raw `fetch` inside a `watch` callback, a `setTimeout`) is invisible to the signal — hand it to `hydrate` via `ready`.
- **Pre-swap inertness:** the server DOM receives no listeners before the swap. Native anchors still navigate (a full page load — graceful pre-interactive degradation); other interaction is inert for the short, bounded settle window.
- **Lifecycle timing matches real attachment:** `onCreated` & `onRendered` fire during the detached render exactly as under `init`; `onMounted` fires at the swap, `onAppMounted` after it.
- **An empty root degrades gracefully** (e.g. a dev server without pre-rendered markup): same deferred-swap path, just swapping into an empty root.
- **Non-hydrating apps pay nothing:** `hydrate` tree-shakes out of an `init`-only bundle entirely.
- **Skip the refetch:** by default the hydrating client re-runs the fetches the server already ran. Route them through the resource cache & they don't have to — see Dehydrated state, next.

### Dehydrated state (skip the client refetch)

Settle-and-swap hydration pays for its data twice: the server ran the app's fetches to produce the markup, & the hydrating client re-runs the same fetches to rebuild the same state — with the swap waiting on them. Dehydration closes that gap. Route data loads through the keyed **resource cache**, serialize the server's settled values into the page, & prime the client's cache from them at boot — primed fetches resolve from local data & never hit the network, so hydration settles almost immediately.

The full story: `renderToString` → `dehydrate` → embed → `primeResources` → `hydrate`.

**API**

- `resource<T>(key: string, fetcher: () => Promise<T>): Promise<T>` - A keyed async memo, per window — the interception point capture & priming share. The first call per key invokes the fetcher, concurrent callers share the in-flight promise, & later calls resolve from cache without invoking the fetcher again. A rejected fetch rejects its sharing callers & is **not** cached — the next call retries. Call it inside an async activity transform (the idiomatic data path), where the returned promise is already tracked by the settlement signal `hydrate` gates on.
- `primeResources(state: DehydratedState): void` - Seeds the current window's resource cache from a dehydrated state object: a primed key resolves with the primed value without ever invoking its fetcher; unprimed keys fetch exactly as before. Run it **before the boot call** — transforms run during first render — & ahead of any boot: `hydrate` & `init` benefit identically.
- `dehydrate(window): DehydratedState` (server entry) - After `await renderToString(app, { window, url })`, returns that window's **settled** resource values as a plain JSON-serializable object. Pending entries (possible when `maxWait`-style drain bounds expire) are skipped; so are unserializable values, with a debug-gated `loom.console` warning — a skipped key is just a client-side cache miss.
- `serializeState(state: DehydratedState): string` (server entry) - Serializes the state to a JSON string safe to inline inside an HTML script element: `<`, U+2028 & U+2029 are escaped, & `JSON.parse` reproduces the original state. Hand-rolling `JSON.stringify` into inline HTML is a known XSS footgun (`</script>` smuggled through content) — always embed through this helper.

**Inclusion** `import { primeResources, resource } from '@loom-js/core';` · `import { dehydrate, serializeState } from '@loom-js/core/server';`

**Quick Example**

Route the app's data loads through `resource` (namespace keys `<domain>:<id>`):

```ts
import { activity, resource } from '@loom-js/core';

const page = activity<PageData | undefined>(undefined, async ({ update }) => {
    update(await resource(`page:${slug}`, () => fetchPage(slug)));
});
```

On the server, capture after the render & embed alongside the markup. The transport is explicit — loom never writes or discovers page structure; the documented convention is a JSON script tag:

```ts
import {
    dehydrate,
    renderToString,
    serializeState
} from '@loom-js/core/server';

const markup = await renderToString(App(), { url: request.url, window });
const stateScript = `<script type="application/json" id="loom-state">${serializeState(
    dehydrate(window)
)}</script>`;
// Inject `markup` & `stateScript` into your HTML shell however you like.
```

On the client, read it back & prime before booting:

```ts
import { hydrate, primeResources } from '@loom-js/core';

const embedded = document.getElementById('loom-state');

embedded && primeResources(JSON.parse(embedded.textContent ?? '{}'));
hydrate({ app: App(), root });
```

**Semantics worth knowing**

- **Key namespacing:** all keys share one per-window map — namespace them `<domain>:<id>` (`page:docs/intro`, `cms:nav`). Collisions follow `Map` semantics (last write wins).
- **Window-lifetime cache; freshness lives in the key:** a cached or primed value persists for the window's lifetime, exactly like `lazyImport` — SPA navigation away & back reuses it. Express freshness through keys (include a content version if needed); TTL/invalidation is deliberately not cache semantics loom owns.
- **The serializability boundary:** only JSON-serializable values dehydrate. Anything else (functions, DOM nodes, circular structures, `undefined`) is skipped with a debug-gated warning — the client simply fetches that key.
- **Graceful everywhere:** a missing, unserializable, or failed entry degrades to a cache miss — the page still works, it just fetches. Fetches not routed through `resource` keep today's behavior exactly; adoption is opt-in & incremental.
- **Bytes:** `resource` & `primeResources` tree-shake out of non-adopting bundles entirely (+171 B min+gzip when adopted); `dehydrate` & `serializeState` live only in the server entry.

## Examples

### App Initialization (bootstrapping the app)

```ts
import { init } from '@loom-js/core';

import content from './content.json';
import { Page } from './page';

const rootNode = document.querySelector('#page-content');
init({
    app: Page(content),
    onAppMounted: () => {
        /*
        Used for manual trigger of `PrerenderSsgWebpackPlugin` static-site-generation.
        This method of prerendering is meant to be called after some async operation
        to allow for fetching content & saturating the DOM before capturing the page content.
        Here, the setTimeout is mimicking this scenario - there are other more appropriate methods
        which may used for async or syncronous rendering use cases.
        */ setTimeout(() => {
            if ((window as any).snapshot) {
                (window as any).snapshot();
            }
        }, 500);
    },
    root: rootNode
});
```

### Components

**Simple example**

```ts
import { component } from '@loom-js/core';

export const Button = component(
    (html) => html`
        <button type="button">Click me!</button>
    `
);
```

**Props & interpolation**

Props passed into a component can be accessed via the second argument of the `component`'s render function argument.
Interpolation is achieved using the JS ES6 standard [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax

```ts
import { component, MouseEventListener } from '@loom-js/core';

export interface ButtonProps {
    className: string;
    label: string;
    onClick?: MouseEventListener;
    type: string;
}
export const Button = component<ButtonProps>(
    (html, { className, label, onClick, type = 'button' }) => html`
        <button $click="${onClick}" class="${className}" type="${type}">
            ${label}
        </button>
    `
);

/*
A component can be a simple function without using the framework `component` method,
and is considered as such so long as it returns a `ContextFunction`.
Since `Button` is created using the `component` method, it will return a `ContextFunction` when called.
Below, `SuperButton` will return the `ContextFunction` of the `Button` output when called - so we're good here.
*/
export const SuperButton = ({ label }: { label: string }) =>
    Button({
        className: 'super-button',
        label
    });
```

**Access the rendered component node**

```ts
import { component } from '@loom-js/core';

/*
`node` is a getter method which all components receive in the props argument,
and will return the rendered node of the component.
The component node will be undefined until the initial render is complete.
Warning: be careful when accessing the node that you're not messing with things which are expected to be intact for each rerender process,
i.e dynamic nodes or attributes within the template.
*/
export const Button = component((html, { node }) => {
    const onClick = () => console.log(document.contains(node()));
    / => true
    return html`<button $click="${onClick}" type="button">Click me!</button>`;
});
```

**Life Cycles**

```ts
import { component, LifeCycleHandler } from '@loom-js/core';

/ There are two component life-cycle methods - `onCreated` & `onRendered`.
/ Each will take life-cycle handler as its argument, and each handler will receive the rendered component node.
/ `onCreated` is called only the first time the component is rendered, firing just before `onRendered`.
/ `onRendered` is called each time the component is rerendered.
export const Button = component((html, { onCreated, onRendered }) => {
    const lifeCycleHandler: LifeCycleHandler = (node) => {
        console.log(node instanceof Node);
        // => true
        console.log(document.contains(node));
        // => false (on creation & 1st render);
        // => true (on rerenders)
    };

    onCreated(lifeCycleHandler); /* Called only once - on creation. */
    onRendered(lifeCycleHandler); /* Called on every render - onCreated will always be called first. */

    return html`<button type="button">Click me!</button>`;
});
```

**Activity example**

```ts
import { activity, component } from '@loom-js/core';

// Initialize a new activity with an initial value.
export const buttonClickActivity = activity(0);
console.log(buttonClickActivity.initialValue); // => 0

export interface BlueLabelProps {
    label: string;
}

// We'll update this label, reactively, as an effect of the activity.
export const BlueLabel = component<BlueLabelProps>(
    (html, { label }) => html`
        <span class="label blue">${ label }<span>
    `
);

export const Button = component(
    html => {
        const { effect, update, value } = buttonClickActivity;
        const onClick = () => {
            update(value() + 1);
            console.log(value()); // increments by 1 for every button click
        };

        // The effect is run immediately on first render and runs every time thereafter when the related activity is updated.
        // The effect must always return the output of a Component, which is a `ContextFunction`.
        // `value` holds the current value of the activity.
        return html`
            <button $click="${onClick}" type="button">
                ${effect(({ value }) =>
                    BlueLabel({ label: `Clicked count: ${value}` })
                )}
            </button>
        `
);
```

**Routing example**

```ts
import {
    SyntheticRouteEvent,
    component,
    locationEffect,
    route
} from '@loom-js/core';
import { About, Home, NotFound } from '@app/component/pages';

export const App = component<unknown>(
    (html) => html`
        <div>
            <header>
                ${/* Standard button example passing options to `route` */}
                <button
                    $click="${(e: SyntheticRouteEvent) =>
                        route(e, {
                            href: '/'
                        })}"
                    type="button"
                >
                    loomjs
                </button>
                ${/* Anchor example demonstrating the simpler `route` usage */}
                <nav>
                    <a $click="${route}" href="/">Home</a> |
                    <a $click="${route}" href="/about">About</a>
                </nav>
            </header>
            <main>
                ${locationEffect(({ value: { pathname } }) => {
                    switch (pathname) {
                        case '/':
                            return Home();
                        case '/about':
                            return About();
                        default:
                            return NotFound();
                    }
                })}
            </main>
        </div>
    `
);
```

## Recognition

Thanks go out to Andrea Giammarchi for providing [the algorithm](https://gist.github.com/WebReflection/d3aad260ac5007344a0731e797c8b1a4) that made this solution possible. It is also at the core of [hyper(HTML)](https://github.com/WebReflection/hyperHTML), a light & fast virtual DOM alternative that Andrea created and maintains.
