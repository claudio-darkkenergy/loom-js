---
slug: components
title: Components
---
Components are loom's unit of UI: a render function around a tagged template, registered with `component`. This topic covers defining components, the template function and its props, the life-cycle hooks, how interpolated values apply, and the pass-through `simple` form.

## Defining a component

A component uses a "tagged template" (w/ [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax) - the template render function - to define its template.

Use `component` to register a template render function. It takes a render function as its argument, passing Loom's template renderer to the render function along with some props, and a getter for the component's rendered node. A template context is bound to the renderer to achieve optimal rerenders.

When using `component`, the tagged template's template string typically contains a single top-level element (one opening & closing tag pair wrapping the whole template). Fragment-rooted templates — starting with `<>`, or whose top level is only component elements — are the exception (see [Element Syntax](/docs/element-syntax)). An interpolated value at the top level doesn't qualify — give it the `<>` prefix.

**API** `component<Props>(templateFunction)`

**Inclusion** `import { component } from '@loom-js/core';`

## The template function

**Arguments**

- interface `TemplateFunction` = `(html, props) => <the rendered template>`
    - `html` (can be named anything) - the template render function ("tagged template") with the bound context. It initializes a component template; once initialized, it efficiently handles updates to the same component using the bound context. Its argument is a `TemplateLiteral` - the template literal typically contains a single top-level `Element` (see above for the fragment-rooted exception). It **returns** the rendered template — return it straight from the template function.
    - `props` (can be named anything or destructured) - an object literal containing dynamic property values for enriching your component, along with a getter, `node()`, which returns the component's rendered node, and the five life-cycle hooks below - each hook takes a handler callback, and that handler receives the component's rendered node as an argument (see Life cycles under Examples, below).

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

## Simple components

`simple` is the pass-through counterpart to `component()`: it wraps a render function that composes _other_ components — no template, no component context of its own. Reach for it when a component's output is entirely another component's output: choosers, prop-mapping wrappers, convenience façades (core's own `Picture` is one — a `<picture>` component when `sources` is present, a bare `<img>` component when not).

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

A defined component is just a function: calling it with props returns a `ContextFunction`, and a `ContextFunction` renders wherever a template accepts a value. The same component composes in two interchangeable forms — as a call, or as markup.

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

/*
 * A component can be a plain function without using the framework `component` method,
 * and is considered as such so long as it returns a `ContextFunction`.
 * Since `Button` is created using the `component` method, it will return a `ContextFunction` when called.
 * Below, `SuperButton` will return the `ContextFunction` of the `Button` output when called - so we're good here.
 */
export const SuperButton = ({ label }: { label: string }) =>
    Button({
        className: 'super-button',
        label
    });

// `simple` wraps exactly this pattern, adding the component typing —
// reserved props (`key`, `className`, …) and the propless-call rules.
```

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

`node()` is the pull-based path — for access at life-cycle moments, the hooks hand their handler the rendered node directly. A fragment-rooted template has no single node, so the handler receives the top-level nodes as an array, in DOM order:

```ts
import { component } from '@loom-js/core';

// Life-cycle handlers receive the rendered node directly — no getter needed.
// The `<>` prefix makes this fragment-rooted, so the handler gets an array.
export const Pair = component((html, { onMounted }) => {
    onMounted((nodes) => {
        console.log((nodes as Node[]).length); // => 2
    });

    return html`
        <>
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
