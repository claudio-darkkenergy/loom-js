---
slug: fragments
title: Fragments
---
A fragment is a template with no single root: its top level is a list of nodes that loom renders, moves, and removes as one group. This topic gathers the rules that orbit that idea — the `<>` token, when a template counts as fragment-rooted, what a fragment is as a value, and how keyed fragments reconcile. (Two homonyms live elsewhere: the URL `#fragment` that [Routing](/docs/routing#hash-and-anchor-navigation) scrolls to, and the HTML snippets `renderToStringSync` is right for under [Server Rendering](/docs/server-rendering#render-to-string-sync).)

## The `<>` token

A template normally wraps everything in one top-level element, and that element is the component's root. `<>` at the start of a template declares it fragment-rooted instead: everything after the token is top-level content, rendered as siblings directly into whatever parent the component lands in. `<>` is a prefix, not an element — there is no closing form, leading whitespace before it is fine, and it never reaches the DOM:

```ts
import { component } from '@loom-js/core';

export const Pair = component<{ definition: string; term: string }>(
    (html, { definition, term }) => html`
        <>
        <dt>${term}</dt>
        <dd>${definition}</dd>
    `
);

// Each Pair renders as two siblings — the <dl> is the only wrapper.
export const Glossary = component(
    (html) => html`
        <dl>
            <${Pair} term="activity" definition="loom's reactive primitive" />
            <${Pair} term="fragment" definition="a template with no single root" />
        </dl>
    `
);
```

Reach for a fragment when the markup around the component owns the wrapper — table rows, list items, definition pairs, a run of siblings a CSS grid lays out directly.

## Root forms and inference

A template's top level takes one of three shapes:

- **A single element** — the default. One opening and closing pair wraps the whole template, and `node()` is that element.
- **An explicit fragment** — the template starts with `<>`, as above.
- **An inferred fragment** — the top level holds only component elements (and whitespace). With no real element left to root the template, the compiler prepends `<>` for you, so a component that renders just another component needs no wrapper and no token:

```ts
import { component } from '@loom-js/core';

import { IconButton } from './icon-button';

const toggleMenu = () => document.body.classList.toggle('menu-open');

// Fragment-rooted by inference — compiles to `<>${IconButton({ … })}`.
export const MenuButton = component(
    (html) => html`
        <${IconButton} icon="icon-menu" onClick=${toggleMenu} />
    `
);
```

Only component _tags_ earn the inference. A lone interpolated value at the top level — `` html`${Child()}` `` — is not recognized as a root and renders nothing; give it the `<>` prefix. The compile itself is [Element Syntax](/docs/element-syntax#transform-time)'s subject; the root forms are the same whichever way you author.

## Fragments as values

Where a single-rooted component has one node, a fragment-rooted one has a node list — and loom hands you the list wherever it would hand you the node. `node()` returns an array of the top-level nodes in DOM order, and every life-cycle handler receives that same array. It holds _every_ top-level node — the whitespace text nodes between your elements included — so filter for elements when elements are what you need:

```ts
import { component } from '@loom-js/core';

export const Pair = component((html, { onMounted }) => {
    onMounted((nodes) => {
        // Whitespace text nodes ride along — filter when you need elements.
        const elements = (nodes as Node[]).filter((n) => n instanceof Element);

        console.log(elements.length); // => 2
    });

    return html`
        <>
        <dt>Term</dt>
        <dd>Definition</dd>
    `;
});
```

As a rendered value, a fragment-rooted component travels exactly like any other: interpolated in a text slot, as an item of a children array, or inside a named slot region. The reconciler treats its nodes as one group — inserted together, moved together, removed together — so `${[Pair({ … }), Pair({ … })]}` behaves the same as two interpolations side by side. A group that resolves to no nodes at all keeps an invisible placeholder at its position, so it can fill in later without disturbing its siblings.

## Keyed reconciliation

Keys give repeated items an identity (see [The `key` prop](/docs/element-syntax#the-key-prop)); for a fragment-rooted item, that identity covers the whole group:

```ts
import { activity, component } from '@loom-js/core';

// The fragment-rooted `Pair` from the first example, in its own module.
import { Pair } from './pair';

type Entry = { definition: string; id: string; term: string };

const entries = activity<Entry[]>([]);

export const Glossary = component(
    (html) => html`
        <dl>
            ${entries.effect(({ value: items }) =>
                items.map((item) =>
                    Pair({
                        definition: item.definition,
                        key: item.id,
                        term: item.term
                    })
                )
            )}
        </dl>
    `
);
```

On an update the reconciler applies the group rules:

- **Reorder moves the group.** Every top-level node of a keyed fragment relocates together, in its original internal order, and each node keeps its identity — an input's value, focus, or scroll position rides along. The group is recognized by its first node, so a persistent instance reuses its live nodes instead of re-rendering.
- **Removal removes the group.** Dropping an item — including truncation, when the new array is shorter — removes every node of that item's group, leaving no orphans.
- **Order is exact.** An array mixing single elements, text values, and fragment groups renders its children in the array's order, with each group contiguous.
- **A kind change replaces the rendering.** An item that was a fragment group and becomes a single element or text value (or the reverse) has its previous nodes fully removed before the new value renders at the same position.
- **Empty groups hold their place.** An item resolving to zero nodes keeps its placeholder, so a later update that gives it content renders between the same siblings.

Children of a keyed fragment need no keys of their own — they move with their parent.

## Named regions are fragments

A named slot region arrives with no wrapper element: interpolating `slots.name` drops the labelled nodes in place as bare siblings, and the region reconciles as its own unit — a fragment in everything but name. The labelling rules live under [Named slots](/docs/element-syntax#named-slots).

**See also** — [Defining a component](/docs/components#defining-a-component) (the single-root rule and its exception) · [Built-in props](/docs/components#built-in-props) (`node()` as a node array) · [Accessing the rendered node](/docs/components#accessing-the-rendered-node) (hook handlers on a fragment) · [Composing in markup](/docs/element-syntax#composing-in-markup) (the inference, compiled) · [Markup vs. the functional form](/docs/element-syntax#markup-vs-the-functional-form) (fragments in value positions) · [The `key` prop](/docs/element-syntax#the-key-prop) · [Named slots](/docs/element-syntax#named-slots) · [No `$` sigil on component tags](/docs/element-syntax#no--sigil-on-component-tags) (why a fragment root can't take `$click`).

That completes the template side of loom: single roots, fragments, and the syntax that composes them. Handing a component to pages that aren't loom at all — as a real `<some-element>` — is [Custom Elements](/docs/custom-elements)' subject, next.
