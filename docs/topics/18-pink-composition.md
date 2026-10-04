---
slug: pink-composition
title: Composing
package: @loom-js/pink
entryTitle: Pink: Composing
---
Every pink component follows the same contract, so once you know how one takes props you know them all. This topic is that contract: the props core gives every component, how pink threads them to its root element, the `is` prop that swaps the root, the compound parts, and the modifiers and behaviors that add an icon, a tooltip or a copy action to anything.

## The props contract

Pink components are loom components, so they take core's `ComponentInputProps`: the component's own props plus the reserved set every component accepts. Each pink component puts the reserved props on its root element.

### Reserved props

| Prop | Lands as |
| --- | --- |
| `className` | Classes on the root, merged with the classes pink adds. |
| `id` | The root's `id`. |
| `style` | The root's inline style — a string, an object, or an array of either (nested arrays flatten; `undefined` entries drop out). |
| `attrs` | Any other attribute on the root — `aria-*`, `data-*`, `type`, `disabled`, `href`. |
| `on` | A map of event name to listener, bound on the root. |
| `onClick` | The click listener; pass core's `route` for client-side navigation on a link. |
| `children` | Content, where the component has a content region. |
| `slots` | Named regions, where the component declares them (`PinkGridHeader`). |
| `key` | Reconciliation identity in lists, as everywhere in loom. |

### `attrs`

Attributes pink does not model as props go through `attrs` — never as stray flat keys, which a component ignores. Where a component owns an attribute it adds it for you (a `PinkButton` without `href` renders `type="button"`); `attrs` entries override those defaults.

```ts
import { component } from '@loom-js/core';
import { PinkButton } from '@loom-js/pink';

export const RemoveButton = component(
    (html) => html`
        <${PinkButton}
            attrs=${{ 'aria-label': 'Remove item', 'data-id': 42 }}
            icon="icon-x"
            isOnlyIcon
            isText
        />
    `
);
```

### `style` as a list

The array form exists so a component can layer its own variables under yours. Pink uses it internally — `PinkButton` sets `--p-button-size` from `buttonSize` and then applies your `style` on top — and you can use it the same way to combine a theme object with per-instance rules:

```ts
import { component } from '@loom-js/core';
import { PinkCard, usePinkTheming } from '@loom-js/pink';

const { style: theme } = usePinkTheming({ cardBorderRadius: '0.25rem' });

export const FlatCard = component(
    (html, { children }) => html`
        <${PinkCard} style=${[theme, { 'max-inline-size': '40rem' }]}>
            ${children}
        </>
    `
);
```

## The polymorphic root

Components whose markup is a single element with pink classes take an `is` prop: the root element as a component value. Pass core's `el(tagName)` or any component, and the pink classes and reserved props land on that root instead of the default:

```ts
import { component, el } from '@loom-js/core';
import { PinkCard, PinkContainer } from '@loom-js/pink';

export const Footer = component(
    (html) => html`
        <${PinkContainer} is=${el('footer')}>© 2026</>
        <${PinkCard} is=${el('article')} isBorderDashed>Draft</>
    `
);
```

`is` is available on `PinkCard`, `PinkContainer`, `PinkGridBox`, `PinkTable` and its parts, `PinkCodePanel`, `PinkSideNav`, `PinkCopyToClipboard` and `PinkTag.Tag`. Components that pick their own root — `PinkButton` (`<button>` or `<a>` by `href`), `PinkAvatar` (`<img>` or `<div>` by `alt`) — do not take it.

## Compound components

Components with internal structure expose their parts as properties: `PinkTable.Head`, `.Body`, `.Foot`, `.Row`, `.HeadCol`, `.Col`, `.Wrapper`; `PinkCollapsible.List`, `.Item`; `PinkDropList.List`, `.Item`, `.Section`; `PinkCodePanel.Header`, `.Content`, `.CopyButton`, `.Tabs`. The parent called directly renders the common form; the parts compose the others:

```ts
import { component } from '@loom-js/core';
import { PinkTable } from '@loom-js/pink';

export const HooksTable = component(
    (html) => html`
        <${PinkTable}>
            <${PinkTable.Head}>
                <${PinkTable.Row}>
                    <${PinkTable.HeadCol}>Hook</>
                    <${PinkTable.HeadCol}>Fires</>
                </>
            </>
            <${PinkTable.Body}>
                <${PinkTable.Row}>
                    <${PinkTable.Col}>onCreated</>
                    <${PinkTable.Col}>Once, on the first render.</>
                </>
            </>
        </>
    `
);
```

## Modifiers

A modifier is a props-in, props-out function: it takes a component's props, adds markup to `children` or a class to `className`, and returns props for the root to render. Pink's own components are built from them, and they wrap any root — `el('button')`, `el('a')`, a component of yours.

### `withIcon`

Prepends (or, with `appendIcon`, appends) an icon `<span>` carrying the `icon` class to `children`. `icon` is a class name — `'icon-plus'` — or an attribute binding (`activity.bind(...)`) that drives the class live without re-rendering the element; `iconProps` reach the icon span.

```ts
import { el, simple } from '@loom-js/core';
import { withIcon } from '@loom-js/pink';

export const ExternalLink = simple<{ href: string; label: string }>(
    ({ href, label }) =>
        el('a')(
            withIcon({
                appendIcon: true,
                attrs: { href, target: '_blank' },
                children: label,
                icon: 'icon-external-link'
            })
        )
);
```

A component that only delegates to another root has no template of its own, so it is a `simple` component — the same form pink's own delegating components take (see [Functional components](/docs/components#functional-components)).

### `withTooltip`

Adds the `tooltip` class to the host and appends a `PinkTooltipPopup` with `popupMessage`; pink shows the popup on hover and focus. `isBottom`, `isCenter` and `isEnd` place it; `popupClassName` reaches the popup. Without a `popupMessage` the props pass through untouched.

### `withAnchorLink`

Gives the host an anchor identity: sets `id` to `anchorId` and appends a `PinkCopyButton` linking to `#anchorId` that copies the absolute URL on click. The docs' headings are this modifier over `el('h2')`. No `anchorId`, no-op; `anchorProps` override the copy button's defaults (its `icon-link` icon, labels, `text` getter).

## Behaviors

A behavior is a component that wraps content and adds an interaction. Pink has one.

### `PinkCopyToClipboard`

A host (`is`, default `<span>`) around any content that copies `text` when clicked, then shows `copiedLabel` in its tooltip for `copiedDurationMs` (default 2000) before reverting to `label`. `text` is a string or a getter for text only known at click time. Children keep their own handlers — an anchor child still navigates.

The static form wraps `children`; the `render` form receives the copied state so the content can reflect it in place — `copied.bind(...)` updates an attribute on the existing node, `copied.effect(...)` re-renders its slot:

```ts
import { component } from '@loom-js/core';
import { type CopyState, PinkCopyToClipboard, PinkInlineCode } from '@loom-js/pink';

const install = 'npm i @loom-js/core';

export const InstallLine = component(
    (html) => html`
        <${PinkCopyToClipboard}
            label="Copy command"
            render=${(copied: CopyState) =>
                PinkInlineCode({
                    children: copied.effect(({ value }) =>
                        value ? 'copied ✓' : install
                    )
                })}
            text=${install}
        />
    `
);
```

`PinkCopyButton` is this behavior with a `PinkButton` in the `render` slot; `PinkCodePanel.CopyButton` is that button sized for a panel header.

## Enums

`PinkColor` (`Blue`, `Green`, `Orange`, `Pink`, `Red`, `Default`, `Empty`) and `PinkSize` (`XSmall` … `XLarge`) name the variants components such as `PinkAvatar` accept; their values are the class suffixes pink's stylesheet uses (`is-color-blue`, `is-size-small`).

## Markup and functional forms

Pink components work in both of loom's forms — `<${PinkButton} …>` in a template, or `PinkButton({ … })` as a value — exactly as [Element Syntax](/docs/element-syntax) describes for any component. The functional form is the natural one for lists built with `map` and for props that are themselves content (`PinkGridItem`'s corners, `PinkActionBar`'s `startContent`); element syntax reads better for layout. Mixing them in one template is fine.
