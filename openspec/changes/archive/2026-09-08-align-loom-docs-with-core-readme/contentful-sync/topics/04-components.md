---
slug: components
title: Components
---
Components are loom's unit of UI: a render function around a tagged template, registered with `component`. This topic covers defining components, the template function and its props, the life-cycle hooks, how interpolated values apply, and the functional forms — plain functions and `simple`.

## Defining a component

A component uses a "tagged template" (w/ [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax) - the template render function - to define its template.

Use `component` to register a template render function. It takes a render function as its argument, passing Loom's template renderer to the render function along with some props, and a getter for the component's rendered node. A template context is bound to the renderer to achieve optimal rerenders.

When using `component`, the tagged template's template string typically contains a single top-level element (one opening & closing tag pair wrapping the whole template). A template whose top level holds anything else — several nodes, text, or an interpolated value — is fragment-rooted (see [Fragments](/docs/fragments)).

**API** `component<Props>(templateFunction)`

**Inclusion** `import { component } from '@loom-js/core';`

## The template function

**Arguments**

- interface `TemplateFunction` = `(html, props) => <the rendered template>`
    - `html` (can be named anything) - the template render function ("tagged template") with the bound context. It initializes a component template; once initialized, it efficiently handles updates to the same component using the bound context. Its argument is a `TemplateLiteral` - the template literal typically contains a single top-level `Element` (see above for the fragment-rooted exception). It **returns** the rendered template — return it straight from the template function.
    - `props` (can be named anything or destructured) - the caller's props merged with the framework's built-in surface — the reserved props, the utilities (`node()`, `createRef()`, `ctxRefs()`, `own()`), and the five life-cycle hooks below. See Built-in props for the full surface.

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

That's a complete component. Its render function receives more than props, though — five hooks fire around each render's life cycle.

## Life-cycle hooks

| Hook | Fires |
| --- | --- |
| `onCreated` | Once — on the first render, as soon as the component's root node exists (before it's in the document). |
| `onBeforeRender` | On every render — after `onCreated` on the first render, before the template's dynamic values are applied. |
| `onRendered` | On every render — after the template's dynamic values are applied. |
| `onMounted` | When the component's node is attached to the live document (at boot's mount sweep, `hydrate`'s swap, or a later DOM insertion). |
| `onUnmounted` | When the component's node is removed from the live document. |

`onMounted` & `onUnmounted` describe a live, observed browser document — they never fire on the server (see [Server Rendering](/docs/server-rendering)).

## Built-in props

Beside the caller's own props, every render function receives a built-in surface: the **reserved props** any component may be handed (typed on every component — the framework consumes `key` & `ref` itself; everything else arrives like any other prop) and the **utilities** the framework adds alongside them.

**Reserved props**

- `children` — the content a caller places between a component element's tags, or passes as `children` in the functional form. Interpolate it where the content belongs (`${children}`). Authoring mechanics — the `</>` closing form, how markup fills it — live under [Children](/docs/element-syntax#children).
- `slots` — named content regions beyond `children`: top-level markup children labelled `slot="name"` arrive as `slots.name`; place each with `${slots?.name}`. See [Named slots](/docs/element-syntax#named-slots).
- `key` — reconciliation identity for repeated instances (`key=${item.id}`); the framework matches keyed instances across re-renders instead of pairing by position. See [The `key` prop](/docs/element-syntax#the-key-prop).
- `ref` — a `RefContext` minted by the parent via `createRef()`. The framework wires it to the receiving component & removes it from the props object — a render function never reads `ref`. See Refs below.
- `attrs` — a bag of attribute name → value pairs. The framework doesn't apply it for you: forward it to your root element's `$attrs` binding (`$attrs=${attrs}`) so callers can set arbitrary attributes without the component naming each one.
- `on` — a bag of event name → listener pairs; forward it to the root element's `$on` binding (`$on=${on}`).
- `onClick` — the single-listener click convention; forward it to the root element's `$click` binding (`$click=${onClick}`).
- `className`, `id`, `style` — root-element identity & styling; forward them onto the root (`class=${className}`, `id=${id}`, `style=${style}`). `style` accepts a string, an object of declarations, or an array of those; a style value that resolves to nothing should be omitted rather than passed empty.
- `routeProps` — the matched route (a `RouteValue`: `params`, `matchedRoute`, `pathname`, the raw `Location`) that the router passes to page components; see [Routing › `routeProps`](/docs/routing#route-props).

**Utilities**

- `node()` — the component's rendered root node (or, for a fragment-rooted template, the array of its top-level nodes — see [Fragments](/docs/fragments#fragments-as-values)). Meaningful from `onCreated` time onward; see the life-cycle table above for when handlers receive it.
- `createRef()` — mints a `RefContext` for reaching a child component's node & hooks; see Refs below.
- `ctxRefs()` — an iterator over every `RefContext` this component has minted, in creation order.
- `own(create)` — instance-memoized values: the first render invokes `create` & caches the result per instance; every re-render returns the cached value, so locally created state survives parent-triggered re-renders. Depth under [Component-scoped state](/docs/activities#component-scoped-state).
- The five life-cycle hooks — `onCreated`, `onBeforeRender`, `onRendered`, `onMounted`, `onUnmounted` — documented in the table above.

### Refs

A ref reaches a *child* component's node & life-cycle hooks from the outside — the case `node()` alone can't cover, since your own `node()` returns your own root. `createRef()` mints a `RefContext`; hand it to a child through its `ref` prop and the framework wires the two together: the ref's `node()` returns the child's rendered root, and its hook setters (`onCreated`, `onBeforeRender`, `onRendered`, `onMounted`, `onUnmounted`) register handlers that fire with the child's node — the same life cycle the child observes, watched from the creator's side. Register ref handlers during the render that creates the ref, before the child first renders.

```ts
import { component } from '@loom-js/core';

const Field = component(
    (html) => html`
        <input type="text" />
    `
);

export const Form = component((html, { createRef }) => {
    const fieldRef = createRef();

    fieldRef.onMounted((node) => (node as HTMLInputElement).focus());

    return html`
        <form><${Field} ref=${fieldRef} /></form>
    `;
});
```

Reach for a ref when the parent needs a child's rendered node (focus, measurement, wiring a third-party library to it) or its life-cycle timing; reach for your own `node()` when the node you need is your own root. `ctxRefs()` complements `createRef()` on the minting side: it iterates every ref the component has created, in creation order — useful when a render loop mints one ref per item.

**See also** — [Children](/docs/element-syntax#children), [Named slots](/docs/element-syntax#named-slots), [The `key` prop](/docs/element-syntax#the-key-prop) & [the `$`-sigil rule](/docs/element-syntax#no--sigil-on-component-tags) (component tags take props verbatim); [Attribute and text values](/docs/components#attribute-and-text-values) (how forwarded values apply to real elements) and [Element bindings](/docs/components#element-bindings) (where forwarded `attrs`/`on`/`onClick` land); [Routing](/docs/routing) (`routeProps`); [Component-scoped state](/docs/activities#component-scoped-state) (`own`).

## Attribute and text values

An interpolated attribute value on a plain element is applied when truthy & **removed when falsy** — that one rule gives you boolean attributes (`disabled=${isDisabled}`) and conditional attributes (`aria-label=${labelOrUndefined}`) for free. The number `0` is the deliberate exception: it is a real value, so `tabindex=${0}`, `min=${0}`, and a `$attrs` entry of `0` render as `"0"` (and `value=${0}` sets the element's value property). Text slots follow the same shape — `${0}` renders `0`, while `undefined`/`null`/`false` render as empty text.

```ts
import { component } from '@loom-js/core';

export const SaveButton = component<{ busy?: boolean; label?: string }>(
    (html, { busy, label }) => html`
        <button aria-label=${label} disabled=${busy} tabindex=${0}>
            Saved ${0} times
        </button>
    `
);

// busy: false, label: undefined
//   => <button tabindex="0">Saved 0 times</button>
// busy: true, label: 'Save'
//   => <button aria-label="Save" disabled tabindex="0">Saved 0 times</button>
```

The rules above cover how a value applies once. Making a value change over time is [Activities](/docs/activities)' job — an `effect` re-renders the content in its slot, and a `bind` keeps a single attribute in sync without re-rendering anything.

```ts
import { activity, component } from '@loom-js/core';

const count = activity(0);

export const Counter = component(
    (html) => html`
        <button
            $click=${() => count.update(count.value() + 1)}
            class=${count.bind((clicks) =>
                clicks > 0 ? 'counter _active' : 'counter'
            )}
            type="button"
        >
            ${count.effect(({ value }) => `Clicked ${value} times`)}
        </button>
    `
);
```

## Element bindings

Real elements carry a small vocabulary of `$`-prefixed attributes that are loom's own — bindings the renderer resolves, not attributes the browser sees.

A `$` attribute never reaches the DOM: it is consumed during the render, and its target is always _that_ element. Four forms exist. On a component tag, `$` means nothing and throws (see [No `$` sigil on component tags](/docs/element-syntax#no--sigil-on-component-tags)).

### `$event`

`$click=${handler}`, `$input=${handler}`, `$submit=${handler}` — any recognized event name attaches `handler` as a listener on the element.

- The recognized set is the standard `GlobalEventHandlers` list (`click`, `input`, `change`, `keydown`, …). Extend it at boot with `globalConfig.events`, or at runtime with `appendEvents` (see [Configuration](/docs/configuration#append-events)).
- One listener per `$event` per element: a re-render with a new handler replaces the previous listener rather than stacking a second.
- A falsy value binds nothing; any other non-function value is skipped with a console warning.

```ts
import { activity, component } from '@loom-js/core';

const query = activity('');

export const SearchBox = component(
    (html) => html`
        <form $submit=${(event: Event) => event.preventDefault()}>
            <input
                $input=${(event: Event) =>
                    query.update((event.target as HTMLInputElement).value)}
                type="search"
            />
        </form>
    `
);
```

### `$attrs`

`$attrs=${object}` spreads an object of attribute name → value pairs onto the element.

- Each entry applies with the same rule as a directly written attribute ([Attribute and text values](/docs/components#attribute-and-text-values), above): truthy sets, falsy removes, `0` is a real value.
- `className` maps to `class`; `style` accepts a string, an object of declarations, or an array of those.
- An entry may itself be a `bind()` value, so one attribute inside the bag tracks an activity without re-rendering.
- A non-object value is ignored with a console warning.

```ts
import { activity, component } from '@loom-js/core';

const isBusy = activity(false);

export const SaveButton = component(
    (html) => html`
        <button
            $attrs=${{
                'aria-busy': isBusy.bind((busy) => String(busy)),
                'data-action': 'save',
                tabindex: 0
            }}
            type="button"
        >
            Save
        </button>
    `
);
// => <button aria-busy="false" data-action="save" tabindex="0" type="button">Save</button>
```

### `$on`

`$on=${object}` attaches one listener per entry — event name → handler.

- Only recognized event names bind; unrecognized names are skipped silently.
- Each entry follows the same replace-not-stack rule as `$event`.
- A non-object value is ignored with a console warning.

```ts
import { component } from '@loom-js/core';

const log = (event: Event) => console.log(event.type);

export const TrackedInput = component(
    (html) => html`
        <input $on=${{ blur: log, focus: log, input: log }} type="text" />
    `
);
```

### `$props`

`$props=${object}` hands a whole object of JS properties to a **registered custom element** — the multi-property form of the `$name=${value}` attribute [Custom Elements](/docs/custom-elements#passing-props-from-a-consuming-page) documents.

- Values arrive uncoerced: objects, arrays, and functions stay what they are.
- On anything that isn't a registered custom element the value is ignored with a warning naming the element.

```ts
import { component } from '@loom-js/core';

const chartProps = {
    onSelect: (point: { x: number; y: number }) => console.log(point),
    series: [3, 1, 4, 1, 5]
};

// <data-chart> is registered with defineElement elsewhere in the app.
export const Report = component(
    (html) => html`
        <data-chart $props=${chartProps}></data-chart>
    `
);
```

The reserved props and the bindings pair up: a component forwards `attrs`, `on`, and `onClick` to its root element's `$attrs`, `$on`, and `$click`, and callers reach the element without the component naming every attribute or event:

```ts
import { activity, component } from '@loom-js/core';

export const ToggleButton = component<{ label: string }>(
    (html, { attrs, label, on, onClick }) => html`
        <button $attrs=${attrs} $click=${onClick} $on=${on} type="button">
            ${label}
        </button>
    `
);

const isBold = activity(false);
const toggleBold = () => isBold.update(!isBold.value());
const announce = (event: Event) => console.log(event.type);

export const Toolbar = component(
    (html) => html`
        <${ToggleButton}
            attrs=${{ 'aria-pressed': isBold.bind((bold) => String(bold)) }}
            label="Bold"
            on=${{ blur: announce, focus: announce }}
            onClick=${toggleBold}
        />
    `
);
```

**See also** — [Built-in props](/docs/components#built-in-props) (the `attrs`/`on`/`onClick` props these bindings receive) · [Attribute and text values](/docs/components#attribute-and-text-values) · [No `$` sigil on component tags](/docs/element-syntax#no--sigil-on-component-tags) · [Configuration › `appendEvents`](/docs/configuration#append-events) · [Custom Elements › Passing props from a consuming page](/docs/custom-elements#passing-props-from-a-consuming-page) (the custom-element `$name` form) · [Client Hydration › Semantics worth knowing](/docs/hydration#semantics-worth-knowing) (bindings are inert until the swap; `replayEvents`).

## Functional components

Not every component needs `component()`. A component is any function that returns a `ContextFunction` — the renderable value a `component()` call produces — so any function meeting that contract composes like the components core builds for you — callable in value positions, writable as a component tag. Two forms cover the ground: a plain function, and `simple`, its typed wrapper.

### Plain functions

A plain function that returns another component's output is a component in its own right — no `component()` call, no template of its own:

```ts
import { component } from '@loom-js/core';

import { Button } from './button';

// Returns `Button`'s `ContextFunction`, so it *is* a component — call it,
// or write it as a tag.
export const SuperButton = ({ label }: { label: string }) =>
    Button({ className: 'super-button', label });

export const Toolbar = component(
    (html) => html`
        <div role="toolbar">
            <${SuperButton} label="Save" />
            ${SuperButton({ label: 'Cancel' })}
        </div>
    `
);
```

What the plain form lacks is the framework's typing: nothing declares the reserved props (`key`, `className`, `ref`, …) on `SuperButton`, and a direct propless call passes nothing at all (`SuperButton()` sees `undefined`). `simple` adds exactly that.

### Simple components

`simple` is the typed counterpart to the plain function above — a pass-through around a render function that composes _other_ components, with no template and no component context of its own. Reach for it when a component's output is entirely another component's output: choosers, prop-mapping wrappers, convenience façades (core's own `Picture` is one — a `<picture>` component when `sources` is present, a bare `<img>` component when not).

**API** `simple<Props>(render)`

**Inclusion** `import { simple } from '@loom-js/core';`

**Arguments**

- `render` - Receives the caller's props (always an object, even on propless calls — destructure freely) & returns one or more `ContextFunction`s from other components.

**Returns** `SimpleComponent` — callable exactly like a `Component`, including as a component element (`<${Button} … />`); props stay optional only while `Props` has no required members. Because a simple component renders no template of its own, it receives no life-cycle hooks & no `node()` getter — those belong to the `component()`s it composes.

```ts
import { simple } from '@loom-js/core';

import { IconButton, TextButton } from './buttons';
import type { ButtonProps } from './buttons';

export const Button = simple<ButtonProps>(({ icon, ...props }) =>
    icon ? IconButton({ icon, ...props }) : TextButton(props)
);
```

The result is callable exactly like any component — element syntax included:

```ts
import { component } from '@loom-js/core';

import { Button } from './button';

export const Toolbar = component(
    (html) => html`
        <div role="toolbar">
            <${Button} icon="icon-save" label="Save" />
            <${Button} label="Cancel" />
        </div>
    `
);
```

## Using components

A defined component is just a function: calling it with props returns a `ContextFunction` (the contract [Functional components](/docs/components#functional-components) spells out), and a `ContextFunction` renders wherever a template accepts a value. The same component composes in two interchangeable forms — as a call, or as markup.

The call form, in a text slot:

```ts
import { component } from '@loom-js/core';

import { Button } from './button';

export const Actions = component(
    (html) => html`
        <div class="actions">
            ${Button({ label: 'Save', type: 'submit' })}
            ${Button({ label: 'Cancel' })}
        </div>
    `
);
```

The markup form — the same `Actions`, authored as elements:

```ts
export const Actions = component(
    (html) => html`
        <div class="actions">
            <${Button} label="Save" type="submit" />
            <${Button} label="Cancel" />
        </div>
    `
);
```

Calls also travel as plain values — into an array, a variable, another component's props:

```ts
const cancel = Button({ label: 'Cancel' });

export const Dialog = component(
    (html, { children }) => html`
        <dialog open>
            ${children}
            <div class="actions">${[Button({ label: 'OK' }), cancel]}</div>
        </dialog>
    `
);
```

Markup is the primary authoring surface, and the call form is its compiled equivalent — [Element Syntax](/docs/element-syntax) covers the syntax and its rules — including [when each form fits](/docs/element-syntax#markup-vs-the-functional-form).

Both `component()` and `simple()` produce components for use *inside* loom templates. Handing one to the outside world — any page, as a real `<some-element>` — is a third registration, `defineElement()`, covered in [Custom Elements](/docs/custom-elements).

## Examples

### Basic example

```ts
import { component } from '@loom-js/core';

export const Button = component(
    (html) => html`
        <button type="button">Click me!</button>
    `
);
```

### Props and interpolation

Props passed into a component can be accessed via the second argument of the `component`'s render function argument. Interpolation is achieved using the JS ES6 standard [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax.

```ts
import { component } from '@loom-js/core';

export interface ButtonProps {
    className: string;
    label: string;
    onClick?: EventListener;
    type?: string;
}

export const Button = component<ButtonProps>(
    (html, { className, label, onClick, type = 'button' }) => html`
        <button $click="${onClick}" class="${className}" type="${type}">
            ${label}
        </button>
    `
);
```

Wrapping `Button` in a plain function — pre-filling `className`, say — needs no `component()` call at all: see [Functional components](/docs/components#functional-components).

### Accessing the rendered node

```ts
import { component } from '@loom-js/core';

/*
 * `node` is a getter method which all components receive in the props argument,
 * and will return the rendered node of the component.
 * The component node will be undefined until the initial render is complete.
 * Warning: be careful when accessing the node that you're not messing with things which are expected to be intact for each rerender process,
 * i.e dynamic nodes or attributes within the template.
 */
export const Button = component((html, { node }) => {
    // A single-rooted template, so `node()` is the one `<button>` element.
    const onClick = () => console.log(document.contains(node() as Element)); // => true

    return html`
        <button $click="${onClick}" type="button">Click me!</button>
    `;
});
```

`node()` is the pull-based path — for access at life-cycle moments, the hooks hand their handler the rendered node directly. A fragment-rooted template has no single node, so the handler receives the top-level nodes as an array, in DOM order (whitespace text nodes included — see [Fragments](/docs/fragments#fragments-as-values)):

```ts
import { component } from '@loom-js/core';

// Life-cycle handlers receive the rendered node directly — no getter needed.
// Two top-level elements make this fragment-rooted, so the handler gets an
// array of every top-level node — whitespace text nodes included.
export const Pair = component((html, { onMounted }) => {
    onMounted((nodes) => {
        const elements = (nodes as Node[]).filter((n) => n instanceof Element);

        console.log(elements.length); // => 2
    });

    return html`
        <dt>Term</dt>
        <dd>Definition</dd>
    `;
});
```

Every hook passes its handler this same argument — the next example puts three of them to work (each hook's timing lives in the [Life-cycle hooks](/docs/components#life-cycle-hooks) table, above).

### Life cycles

```ts
import { component, LifeCycleHandler } from '@loom-js/core';

// There are five component life-cycle hooks - `onBeforeRender`, `onCreated`, `onMounted`, `onRendered` & `onUnmounted`
// (see "Life-cycle hooks" above for their timing).
// Each takes a life-cycle handler as its argument, and each handler receives the rendered component node.
// `onCreated` is called only the first time the component is rendered, firing just before the first `onRendered`.
// `onRendered` is called each time the component is rendered.
export const Button = component(
    (html, { onCreated, onMounted, onRendered }) => {
        const lifeCycleHandler: LifeCycleHandler = (node) => {
            console.log(node instanceof Node); // => true
            // => false on creation & 1st render, true on rerenders
            console.log(node instanceof Node && document.contains(node));
        };

        onCreated(lifeCycleHandler); /* Called only once - on creation. */
        onRendered(
            lifeCycleHandler
        ); /* Called on every render - onCreated will always be called first. */
        onMounted((node) => {
            /* Called when the node is attached to the live document. */
            console.log(node instanceof Node && document.contains(node)); // => true
        });

        return html`
            <button type="button">Click me!</button>
        `;
    }
);
```

Those are the pieces of a single component. Composing components *together* — as markup, with props, children, and slots — is its own surface: [Element Syntax](/docs/element-syntax) picks up there.
