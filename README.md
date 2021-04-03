[TOC]

# Nectar JS

> (Beta Release) A lightweight, functional JavaScript framework for building component-based reactive applications.

## Feature Highlights

-   **Micro-updates** on rerenders - updates are made at the attribute & node-levels.
-   **Self-cleanup** of nodes leveraging native JS garbage collection & Weakmap.
-   **Reactivity** to rerender any number of components used within a component template.
-   **Tagged Templates** for performant processing of component templates.
-   **0 Dependencies**
-   **Typescript Types** included.

## Install

```bash
npm i @darkkenergy/nectar@beta -S
```

## Inclusion

```js
// CommonJS
const Nectar = require('@darkkenergy/nectar');

// ES6
import * as Nectar from '@darkkenergy/nectar';

// Typescript Types
import * as NectarTypes from '@darkkenergy/nectar/dist/types';
```

## Concepts

### Bootstrapping your application

The app is where you first introduce your component ecosystem (one or more components that will drive your application). Bootstrapping is the process where you create and configure your app.

**API** `init(options)`

**Inclusion** `import { init } from '@darkkenergy/nectar';`

**Arguments**

-   interface `AppInitProps` = `{ app: (ctx?: TemplateContext) => Node; onAppMounted?: (mountedApp: Node) => any; root: HTMLElement; }`

    -   `app` - A `ContextFunction` which returns a single node (the app node) that will contain all other nodes from your app's component ecosystem, and it will eventually be appended to the app's root node once the initial render is complete.

    -   `onAppMounted` - A callback function which gets called once the app node is appended to the desired DOM root node.

    -   `root` - A DOM node which the app node is appended to once the initial render is complete.

**Quick Example**

```js
import { init } from '@darkkenergy/nectar';
import { App } from './app';

init({
    app: App(),
    onAppMounted: (app) => console.log(document.contains(app)), // => true
    root: document.body
});
```

### Components

A component uses a "tagged template" (w/ [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax) - the template render function - to define its template.

Use `component` to register a template render function. It takes a render function as its argument, passing Nectar's template renderer to the render function along with some props, and a getter for the component's rendered node. A template context is bound to the renderer to achieve optimal rerenders.

When using `component`, the tagged template's template string must contain only one element opening & closing tag at the start & end of the template string and must belong to the same element.

**API** `component<PropsInterface>(template)`

**Inclusion** `import { component } from '@darkkenergy/nectar';`

**Arguments**

-   interface `RenderFunction` = `{ (render, props) => Node }`

    -   `render` (can be named anything) - the template render function ("tagged template") with the bound context.

        -   Initializes a component template.
        -   Once initialized, it efficiently handles updates to the same component using the bound context.

        **Arguments**

        -   type `TemplateLiteral` = `` `my template literal` ``
            -   **Note** - The template literal must contain only one top-level node, of the `Element` type.

        **Returns** `Node`

    -   `props` (can be named anything or destructured) - an object literal containing dynamic property values for enriching your component, along with a getter, `node()`, which returns the component's rendered node.

**Returns** `Component` The callable component function.

**Quick Example**

```js
import { component } from '@darkkenergy/nectar';

interface ButtonProps {
    label: string;
    type: string;
}

export const Button =
    component <
    ButtonProps >
    ((html, props) => html`
        <button type="${props.type}">${props.label}</button>
    `);
```

### Activities (reactivity)

An activity uses a pub/sub pattern at its core. This concept directly supports reactive behavior within your component ecosystem.

When creating a new activity, you may provide a default value. One or more effects may be queued within your component ecosystem for any given activity. Then, by hooking an activity update to some event, all subscribed effects will be called in order of "first-in, first-out".

**API** `activity<any>(initialValue)`

**Inclusion** `import { activity } from '@darkkenergy/nectar';`

**Arguments**

-   `initialValue` - any type of value which is unchanged throughout the life of the activity.

**Returns** `{ effect: ActivityEffect<T = any>; update(newValue: T): void; value(): T; }`

-   **Interface**

    _Properties_

    -   `initialValue`
        -   Any type of value which is unchanged throughout the life of the activity.

    _Methods_

    -   `effect(({ value }) => (ctx?: TemplateContext) => Node)`
        -   An effect is called at least once per use, when it's first introducted during the component render process. Additionally, it's called once per activity update.
        -   `value` - the initial activity value, or the new value on updates.
    -   `update(newValue)`
        -   Calling this method will trigger all subscribed effects from the related activity, passing the new value to each effect.
    -   `value()`
        -   A getter which always returns the current value, which is initially `initialValue`.

**Quick Example**

```js
import { activity } from '@darkkenergy/nectar';

const initialValue = 0;
export const buttonClickActivity = activity(initialValue);

console.log(buttonClickActivity.initialValue); // => 0
console.log(buttonClickActivity.value()); // => 0
buttonClickActivity.update(1);
console.log(buttonClickActivity.initialValue); // => 0
console.log(buttonClickActivity.value()); // => 1

// See the Activity Example, below, for an `effect()` usage example.
```

## Examples

### App Initialization (bootstrapping the app)

```js
import { init } from '@darkkenergy/nectar';

import { Page } from './page';
import content from './content.json';

const rootNode = document.querySelector('#page-content');

init({
    app: Page(content),
    onAppMounted: () => {
        // Used for manual trigger of `presite` static-site-generation (https://github.com/egoist/presite)
        if ((window as any).snapshot) {
            (window as any).snapshot();
        }
    },
    root: rootNode
});
```

### Components

**Simple example**

```js
import { component } from '@darkkenergy/nectar';

export const Button = component(
    (html) => html` <button type="button">Click me!</button> `
);
```

**Props & interpolation**

Props passed into a component can be accessed via the second argument of the `component`'s render function argument.
Interpolation is achieved using the JS ES6 standard [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax

```js
import { component } from '@darkkenergy/nectar';

export interface ButtonProps {
    className: string;
    label: string;
    type: string;
}

export const Button =
    component <
    ButtonProps >
    ((html, { className, label, type = 'button' }) => html`
        <button $click="${onClick}" class="${className}" type="${type}">
            ${label}
        </button>
    `);

// A component can be a simple function without using the framework `component` method,
// and is considered as such so long as it returns a `ContextFunction`.
// Since `Button` is created using the `component` method, it will return a `ContextFunction` when called.
// Below, `SuperButton` will return the `ContextFunction` of the `Button` output when called - so we're good here.
export const SuperButton = ({ label }: { label: string }) =>
    Button({
        className: 'super-button',
        label
    });
```

**Access the rendered component node**

```js
import { component } from '@darkkenergy/nectar';

// `node` is a getter method which all components receive in the props argument,
// and will return the rendered node of the component.
// The component node will be undefined until the initial render is complete.
// Warning: be careful when accessing the node that you're not messing with things which are expected to be intact for each rerender process,
// i.e dynamic nodes or attributes within the template.
export const Button = component((html, { node }) => {
    const onClick = () => console.log(document.contains(node())); // => true
    return html` <button type="button">Click me!</button> `;
});
```

**Activity example**

```js
import { activity, component } from '@darkkenergy/nectar';

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

## Recognition

Thanks go out to Andrea Giammarchi for providing [the algorithm](https://gist.github.com/WebReflection/d3aad260ac5007344a0731e797c8b1a4) that made this solution possible. It is also at the core of [hyper(HTML)](https://github.com/WebReflection/hyperHTML), a light & fast virtual DOM alternative that Andrea created and maintains.
