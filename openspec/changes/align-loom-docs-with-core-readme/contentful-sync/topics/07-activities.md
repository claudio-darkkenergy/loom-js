---
slug: activities
title: Activities
---
## The activity

An activity uses a pub/sub pattern at its core. This concept directly supports reactive behavior within your component ecosystem.

When creating a new activity, you provide an initial value — & optionally a transform and/or options. One or more effects may be queued within your component ecosystem for any given activity. Then, by hooking an activity update to some event, all subscribed effects will be called in order of "first-in, first-out".

**API** `activity<V, I = V>(initialValue, transformOrOptions?, options?)`

`V` is the stored value type; `I` is the `update()` input type, which only differs from `V` when a transform maps one to the other.

**Inclusion** `import { activity } from '@loom-js/core';`

**Arguments**

- `initialValue: V` - The starting value. `reset()` returns to it, & it stays available as the frozen `initialValue` property, so the baseline can't drift.
- `transformOrOptions?: ActivityTransform<V, I> | ActivityOptions<V, I>` - Either the transform function, or the options object when no transform is needed.
- `options?: ActivityOptions<V, I>` - The options object, when the second argument is a transform.

## Transforms (the async-data path)

A transform sits between `update()` & the stored value: every `update(input)` call routes through it, & only the transform's own `update` calls commit values. It receives one context object:

- `input: I` - Whatever the caller passed to `update()` — may be a different type than the stored `V`.
- `update(next: V)` - Commits a value; call it as many times as needed (e.g. a loading state first, then the data).
- `value: V` - The current value at the moment the update was dispatched.

**An async transform's returned promise is tracked by the settlement signal** — `settled()`, the signal `renderToString` & `hydrate` gate on — which is what lets server renders & hydration swaps wait for activity data to land. This makes transforms the framework's idiomatic path for async data (see [Server Rendering](/docs/server-rendering), [Client Hydration](/docs/hydration) & [Dehydrated State](/docs/dehydrated-state)):

```ts
import { activity } from '@loom-js/core';

const page = activity<PageData | undefined, string>(
    undefined,
    async ({ input: slug, update }) => {
        update(await fetchPage(slug));
    }
);

// Callers pass the transform's input type — here, the slug string.
page.update('docs/intro');
```

## Options

`ActivityOptions`:

- `deep?: boolean` - [Default: `false`] Compare plain objects property-by-property & arrays element-by-element (a shallow diff) instead of by reference, so a same-content update doesn't cascade to subscribed effects.
- `force?: boolean` - [Default: `false`] Treat every update as a change, skipping comparison entirely.
- `transform?: ActivityTransform<V, I>` - The transform, for when options ride in the second argument.

## The returned interface

_Properties_

- `initialValue` - The value the activity started with. Frozen (`Object.freeze`) when it's an object, so the reset baseline can't be mutated.

_Methods_

### `effect`

`effect(({ value }) => TemplateTagValue)`

- An effect is called at least once per use, when it's first introduced during the component render process. Additionally, it's called once per activity update.
- `value` - the initial activity value, or the new value on updates.
- The action returns what renders in the effect's slot — idiomatically a called component (a `ContextFunction`), though any interpolatable `TemplateTagValue` is accepted.

### `bind`

`bind(select?)`

- Creates a reactive attribute binding for template attr slots — the bound attribute applies `select` of the current value immediately and stays in sync with every update, **without re-rendering the component**. Cleanup is automatic: the binding is disposed when a re-render replaces the slot's value and on unmount.
- `select` - projects the activity value to the attribute value; defaults to identity.
- Prefer `bind` over an `effect` boundary when only an attribute depends on the activity; prefer `effect` when content or structure changes.

### `reset`

`reset()`

- Shorthand for `update(initialValue)` — returns the activity to its starting value (subject to the same change comparison as any update).

### `update`

`update(input, forceUpdate?)`

- Calling this method will trigger all subscribed effects from the related activity, passing the new value to each effect. With a transform, `input` is handed to the transform (which commits through its own `update`); without one, `input` is stored directly.
- `forceUpdate` - [Default: the `force` option] Treat this one update as a change regardless of comparison.

### `value`

`value()`

- A getter which returns the current value, initially `initialValue`. Plain objects & arrays come back as a shallow copy, so mutating the returned value can't defeat change detection — commit changes through `update()`.

### `watch`

`watch(action)`

- Subscribes a caller-managed handler: `action` runs immediately with the current value, then on every update.
- Returns an `Unsubscriber` — cleanup is the caller's responsibility (e.g. pair it with `onUnmounted`), unlike `effect` (context-managed) and `bind` (template-managed).

## Examples

### Attribute binding

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

### Counter

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

The same counter driving a component through `effect` (see [Components](/docs/components) for the template side):

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
        <span class="label blue">${label}</span>
    `
);

export const Button = component((html) => {
    const { effect, update, value } = buttonClickActivity;
    const onClick = () => {
        update(value() + 1);
        console.log(value()); // increments by 1 for every button click
    };

    // The effect is run immediately on first render and runs every time thereafter when the related activity is updated.
    // The effect returns what renders in its slot - idiomatically the output of a component (a `ContextFunction`).
    // `value` holds the current value of the activity.
    return html`
        <button $click="${onClick}" type="button">
            ${effect(({ value }) =>
                BlueLabel({ label: `Clicked count: ${value}` })
            )}
        </button>
    `;
});
```

[Lazy Imports](/docs/lazy-imports) are built on this same primitive — a dynamic `import()` wrapped in an activity.
