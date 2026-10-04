---
slug: pink-components
title: Components
package: @loom-js/pink
entryTitle: Pink: Components
---
Components are pink's composite pieces: a table, a collapsible, a drop list, tabs, avatars. Each takes the [shared props](/docs/pink-composition) plus those listed here, and the structured ones expose their parts as properties. [Code Panels](/docs/pink-code-panels) has a topic of its own.

## `PinkActionBar`

A `<section class="action-bar">` with a start and an end cluster. `startContent` and `endContent` are each a props object for their `<div>` — `children` for the content, plus `className`, `attrs`, `style`, `on`, `onClick`.

```ts
import { component } from '@loom-js/core';
import { PinkActionBar, PinkButton } from '@loom-js/pink';

export const SelectionBar = component<{ count: number }>(
    (html, { count }) => html`
        <${PinkActionBar}
            startContent=${{ children: `${count} selected` }}
            endContent=${{
                children: PinkButton({ children: 'Delete', icon: 'icon-trash', isSecondary: true })
            }}
        />
    `
);
```

[Story](https://loom-js-pink.vercel.app/?path=/story/components-pinkactionbar--main)

## `PinkAvatar`

An avatar in two forms, chosen by `alt`: a string `alt` renders an `<img>` (with `src`, `width`, `height`), no `alt` renders a `<div>` whose `children` are the initials or an icon. `color` is a `PinkColor`, `size` a `PinkSize` (default `Medium`); `isWith3Char` tightens the type for three-letter initials.

```ts
import { simple } from '@loom-js/core';
import { PinkAvatar, PinkColor, PinkSize } from '@loom-js/pink';

export const Author = simple<{ name: string; photo?: string }>(
    ({ name, photo }) =>
        photo
            ? PinkAvatar({ alt: name, size: PinkSize.Small, src: photo })
            : PinkAvatar({ children: name.slice(0, 2), color: PinkColor.Pink, size: PinkSize.Small })
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinkavatar--types)

## `PinkAvatarGroup`

A `<ul class="avatars-group">` of overlapping avatars — a `PinkAvatar` per entry of `itemProps`, each in its own `<li>` (`listItemProps` reach every one). Pass `children` to supply the items yourself.

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinkavatargroup--images)

## `PinkCollapsible`

A disclosure built on the native `<details>`/`<summary>`, so it opens and closes without script and works before hydration. Called directly it renders the single-item form; the parts build accordions and custom headers.

| Prop | Effect |
| --- | --- |
| `title` | The always-visible header label. |
| `optionalLabel` | A muted label after the title, e.g. `(optional)`. |
| `isOpen` | Renders open (`<details open>`). |
| `isDisabled` | The disabled state — rendered as `<div>`s, since a disclosure that never opens would misannounce. |
| `buttonProps` | Extra props for the header: `className`, `iconClassName` for the chevron. |
| `contentProps` | Extra props for the content region around `children`. |

`PinkCollapsible.List` is the `<ul class="collapsible">`; `PinkCollapsible.Item` is one `<li>` with its `<details>` — `buttonProps.children` render the header, `children` the content, plus `isOpen`, `isDisabled`, `contentProps`:

```ts
import { component, el } from '@loom-js/core';
import { PinkCollapsible } from '@loom-js/pink';

const sections = ['Options one', 'Options two', 'Options three'];

export const Accordion = component(
    (html) => html`
        <${PinkCollapsible.List}>
            ${sections.map((title, index) =>
                PinkCollapsible.Item({
                    buttonProps: { children: el('span')({ children: title, className: 'text' }) },
                    children: el('p')({ children: `Settings for ${title.toLowerCase()}.` }),
                    isOpen: index === 0
                })
            )}
        </>
    `
);
```

The docs side nav is a `PinkCollapsible` per topic group inside a `PinkDropList`, the active group rendered open.

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinkcollapsible--single)

## `PinkDropList`

A link list: a `drop-list-wrapper` around a `drop-section` around a `<ul class="drop-list">`, one `<li>` with a `drop-button` anchor per entry of `itemProps` — `children`, `href`, `target`, `isSelected`, `onClick`, plus `icon`/`appendIcon`/`iconProps` via `withIcon`. `listItemProps` reach every `<li>`; `children` replaces the generated items.

The parts are exported for custom structures: `PinkDropList.List` (the `<ul>` and its items), `.Item` (one `<li>`), `.Section` (the `<section class="drop-section">`, with an optional `role`). `PinkSideNav` composes them.

[Story](https://loom-js-pink.vercel.app/?path=/story/components-pinkdroplist--main)

## `PinkGridItem`

A `PinkCard` laid out as a four-corner grid item: `topLeft`, `topRight`, `bottomLeft`, `bottomRight` are each content placed in its corner, omitted corners render nothing. The props replace `children`.

[Story](https://loom-js-pink.vercel.app/?path=/story/components-pinkgriditem--main)

## `PinkTable`

A `<table class="table">` (`is` to change it — pink also styles `<ul>`-based list tables) composed from its parts.

| Prop | Effect |
| --- | --- |
| `isRemoveOuterStyles` | No outer border or radius. |
| `isStickyScroll` | Sticky header while scrolling. |
| `isTableLayoutAuto` | `table-layout: auto`. |
| `isTableRowMediumSize` | The medium row height. |
| `isVertical` | Vertical layout — header column rather than header row. |

| Part | Renders |
| --- | --- |
| `PinkTable.Head`, `.Body`, `.Foot` | `<thead>`, `<tbody>`, `<tfoot>` (`is` to change). |
| `PinkTable.Row` | `<tr class="table-row">`; pass `is` for an interactive row — an anchor or a button-role element pink styles with hover and focus. |
| `PinkTable.HeadCol`, `.Col` | `<th class="table-thead-col">`, `<td class="table-col">`. |
| `PinkTable.Wrapper` | Overflow containment; `withScroll` keeps the rounded-corner clipping while scrolling. |

```ts
import { component } from '@loom-js/core';
import { PinkTable } from '@loom-js/pink';

const hooks = [
    ['onCreated', 'Once, on the first render.'],
    ['onRendered', 'On every render, after dynamic values apply.'],
    ['onMounted', 'When the node attaches to the live document.']
];

export const HooksTable = component(
    (html) => html`
        <${PinkTable.Wrapper} withScroll>
            <${PinkTable}>
                <${PinkTable.Head}>
                    <${PinkTable.Row}>
                        <${PinkTable.HeadCol}>Hook</>
                        <${PinkTable.HeadCol}>Fires</>
                    </>
                </>
                <${PinkTable.Body}>
                    ${hooks.map(([hook, fires]) =>
                        PinkTable.Row({
                            children: [
                                PinkTable.Col({ children: hook }),
                                PinkTable.Col({ children: fires })
                            ]
                        })
                    )}
                </>
            </>
        </>
    `
);
```

The parts are also exported flat (`PinkTableRow`, `PinkTableCol`, …) for imports that prefer it.

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinktable--table)

## `PinkTabs`

Link tabs — a `<div class="tabs">` with a `<ul>` of anchors — for switching between pages or views. `tabsListProps.itemProps` are the tabs (`children`, `href`, `target`, `isSelected`, `onClick`), `tabsListProps.listItemProps` reach every `<li>`. Scroll controls appear at both ends for overflow; `hideControls` removes them. Not the code panel's tab strip — that is [`PinkCodePanel.Tabs`](/docs/pink-code-panels#tabs).

```ts
import { component, route } from '@loom-js/core';
import { PinkTabs } from '@loom-js/pink';

export const ViewTabs = component<{ current: string }>(
    (html, { current }) => html`
        <${PinkTabs}
            hideControls
            tabsListProps=${{
                itemProps: ['overview', 'settings'].map((view) => ({
                    children: view,
                    href: `/project/${view}`,
                    isSelected: current === view,
                    onClick: route
                }))
            }}
        />
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinktabs--with-controls)

## `PinkToggleButton`

A segmented control: a `<div class="toggle-button">` with one `<button>` per entry of `buttonProps`. Each entry takes `children`, `isSelected`, `disabled`, `title`, `type`, the `withIcon` props and the reserved set; the selected entry carries `is-selected`.

```ts
import { component } from '@loom-js/core';
import { PinkToggleButton } from '@loom-js/pink';

export const ViewToggle = component<{ grid: boolean; onToggle: (grid: boolean) => void }>(
    (html, { grid, onToggle }) => html`
        <${PinkToggleButton}
            buttonProps=${[
                { icon: 'icon-view-list', isSelected: !grid, onClick: () => onToggle(false) },
                { icon: 'icon-view-grid', isSelected: grid, onClick: () => onToggle(true) }
            ]}
        />
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/components-pinktogglebutton--states)
