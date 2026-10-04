---
slug: pink-layout
title: Layout
entryTitle: Pink: Layout
---
The layout components frame a page: a container, a grid, a page header, a side nav and a top nav. They are the pieces the docs site itself is built from, so the closing section shows them assembled. Each takes the [shared props](/docs/pink-composition) plus those listed here.

## `PinkContainer`

A `<div class="container">` — pink's centered, max-width content column. Takes `is` for another root (`el('footer')`, `el('main')`).

[Story](https://loom-js-pink.vercel.app/?path=/story/layout-pinkcontainer--main)

## `PinkGridBox`

A responsive card grid; the root is a `<ul class="grid-box">` (`is` to change it) and the children are its items. The props map onto the grid's variables and are omitted from the style when unset:

| Prop | Effect |
| --- | --- |
| `cols` | A number renders `repeat(n, 1fr)`; `'auto'` (default) lets the item size decide. |
| `gridItemSize`, `gridItemSizeSmallScreens` | The minimum item width, and its override at small widths. |
| `gridGap` | The gap. |
| `gridAutoRows` | `grid-auto-rows` — `'min-content'`, `'1fr'`, any value. |

```ts
import { component, el } from '@loom-js/core';
import { PinkCard, PinkGridBox } from '@loom-js/pink';

export const Features = component<{ features: string[] }>(
    (html, { features }) => html`
        <${PinkGridBox} gridGap="1rem" gridItemSize="16rem">
            ${features.map((feature) =>
                PinkCard({ children: feature, is: el('li') })
            )}
        </>
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/layout-pinkgridbox--auto-columns)

## `PinkGridHeader`

A page header on pink's header grid. Content arrives through named slots, not props: `col1` is the leading column (the title), `col2`–`col4` render in a trailing cluster that collapses on mobile. Slotted content renders as authored, so place the grid classes (`grid-header-col-1` … `-4`) on your own elements.

```ts
import { component } from '@loom-js/core';
import { PinkButton, PinkGridHeader } from '@loom-js/pink';

export const DatabasesHeader = component(
    (html) => html`
        <${PinkGridHeader}>
            <h2 slot="col1" class="heading-level-5 grid-header-col-1">Databases</h2>
            <${PinkButton} slot="col2" className="grid-header-col-2" icon="icon-plus">
                Create database
            </>
        </>
    `
);
```

[Story](https://loom-js-pink.vercel.app/?path=/story/layout-pinkgridheader--example)

## `PinkSideNav`

The side navigation: a `<nav class="side-nav">` (`is` to change it) with a main area and an optional `bottom` section. The main area has two forms:

- `topLinkProps` — one flat list of links, each a [`PinkDropList`](/docs/pink-components#pink-drop-list) item (`children`, `href`, `icon`, `isSelected`, `onClick`).
- `top` — arbitrary content, for a nav with several labelled sections or collapsible groups. Takes precedence over `topLinkProps`.

```ts
import { component, route } from '@loom-js/core';
import { PinkSideNav } from '@loom-js/pink';

export const AppNav = component<{ current: string }>(
    (html, { current }) => html`
        <${PinkSideNav}
            topLinkProps=${[
                { children: 'Home', href: '/', icon: 'icon-home', isSelected: current === '/', onClick: route },
                { children: 'Docs', href: '/docs', icon: 'icon-document', isSelected: current === '/docs', onClick: route }
            ]}
        />
    `
);
```

The docs site's nav is the `top` form: a `PinkDropList` whose items are `PinkCollapsible` groups, the active topic's group rendered open.

[Story](https://loom-js-pink.vercel.app/?path=/story/layout-pinksidenav--nav)

## `PinkTopNav`

A horizontal `<nav>` of links from `items` — each `children`, `href`, `target`, `className`, `attrs` and an optional `onClick`. The nav-level `onClick` and `on` apply to every item that supplies none of its own, so one `route` handler covers the internal links while an external item opts out with its own handler:

```ts
import { component, route } from '@loom-js/core';
import { PinkTopNav } from '@loom-js/pink';

export const SiteNav = component(
    (html) => html`
        <${PinkTopNav}
            items=${[
                { children: 'Docs', href: '/docs' },
                { children: 'Benchmarks', href: '/benchmarks' },
                { children: 'GitHub', href: 'https://github.com/claudio-darkkenergy/loom-js', onClick: () => {}, target: '_blank' }
            ]}
            onClick=${route}
        />
    `
);
```

[Story](https://loom-js-pink.vercel.app/?path=/story/layout-pinktopnav--nav)

## Putting a page together

The docs site's shell is these five in one template: a `PinkGridHeader` with the brand in `col1` and a `PinkTopNav` in `col2`, a `<main>` whose docs pages render a `PinkSideNav` beside the content, and a `PinkContainer` rendered as the `<footer>`:

```ts
import { component, el, route } from '@loom-js/core';
import { PinkContainer, PinkGridHeader, PinkTopNav } from '@loom-js/pink';

export const PageLayout = component(
    (html, { children }) => html`
        <div id="layout" class="body-text-1">
            <${PinkGridHeader} className="u-padding-16">
                <a slot="col1" class="grid-header-col-1" href="/" onClick=${route}>loom</a>
                <${PinkTopNav}
                    slot="col2"
                    className="grid-header-col-2"
                    items=${[{ children: 'Docs', href: '/docs' }]}
                    onClick=${route}
                />
            </>
            <main>${children}</main>
            <${PinkContainer} is=${el('footer')}>© 2026</>
        </div>
    `
);
```

Utility classes (`u-flex`, `u-gap-16`, `u-padding-16`, `body-text-1`) are part of the stylesheet and fill the gaps between components; the `utilities` layer sits last in the cascade so they win over component defaults.
