---
slug: pink-elements
title: Elements
package: @loom-js/pink
entryTitle: Pink: Elements
---
Elements are pink's single-purpose building blocks: a button, a card, a tag, a loader. Each takes the [shared props](/docs/pink-composition) plus the handful listed here, and each has a story in Storybook's Elements group. Props are shown as element-syntax attributes; the functional form takes the same names.

## `PinkBox`

A `<div class="box">` — pink's padded, bordered surface. `children` only.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkbox--box)

## `PinkBoxes`

A `boxes-wrapper` around a `PinkBox` per entry of `boxProps` — boxes laid out as a group, each entry the props of one box.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkboxes--boxes)

## `PinkButton`

The button. Its root is a `<button type="button">`, or an `<a>` when `href` is given; everything pink adds is a class or a variable.

| Prop | Effect |
| --- | --- |
| `href`, `target` | Anchor root; `target` defaults to `_self`. |
| `type`, `disabled`, `title` | Button root only. |
| `isSecondary` | The secondary color scheme. |
| `isText` | No background or border. |
| `isBig` | Pink's large preset: height, horizontal padding and font size. |
| `isOnlyIcon` | Sized for an icon with no label. |
| `icon`, `appendIcon`, `iconProps` | The icon, via `withIcon`. |
| `buttonSize`, `fontSize`, `padding` | Custom height, font size and horizontal padding, as CSS lengths. |

```ts
import { component, route } from '@loom-js/core';
import { PinkButton } from '@loom-js/pink';

export const Actions = component(
    (html) => html`
        <${PinkButton} icon="icon-plus">Create</>
        <${PinkButton} href="/docs" onClick=${route} isSecondary>Read the docs</>
        <${PinkButton} icon="icon-x" isOnlyIcon isText attrs=${{ 'aria-label': 'Close' }} />
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/elements-pinkbutton--types)

## `PinkButtonsList`

A `<ul class="buttons-list">` with a `PinkButton` per entry of `itemProps`, each in its own `<li>`; `listItemProps` reach every `<li>`. Pass `children` instead to supply the items yourself.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkbuttonslist--buttons-list)

## `PinkCard`

The card surface. Takes `is` (default `<div>`), `isBorderDashed` for the dashed outline and `isAllowFocus` to make it a focus target. Theme its background, radius and padding through [`usePinkTheming`](/docs/pink#use-pink-theming).

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkcard--main)

## `PinkCopyButton`

An icon-only text button that copies `text` on click — `PinkCopyToClipboard` with a `PinkButton` rendered from the copied state, so the icon swaps in place (`icon`, default `icon-duplicate`, to `copiedIcon`, default `icon-check`) and the tooltip label follows (`label`, `copiedLabel`). With `href` it is an anchor as well as a copy control, native link behavior intact; `onClick` lands on the button itself, so a router handler works. `buttonSize` sets the height.

```ts
import { component } from '@loom-js/core';
import { PinkCopyButton } from '@loom-js/pink';

export const CopyId = component<{ id: string }>(
    (html, { id }) => html`
        <code>${id}</code>
        <${PinkCopyButton} label="Copy id" text=${id} />
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/elements-pinkcopybutton--default)

## `PinkInlineCode`

A `<code class="inline-code">` for a command, identifier or file name inside a sentence. It is a functional composition over `el('code')` on purpose: pink styles `code` as `white-space: pre-wrap`, and the functional form carries no template whitespace to render.

[Stories](https://loom-js-pink.vercel.app/?path=/story/elements-pinkinlinecode--inline-code)

## `PinkInlineTag`

A `<span class="inline-tag">` — the small count label inside a button or heading. `isInfo` for the information color, `isDisabled` for the muted state.

[Stories](https://loom-js-pink.vercel.app/?path=/story/elements-pinkinlinetag--inline-tag)

## `PinkTag`

A `<div class="tag">` for categorizing content. Flags: `isInfo`, `isSuccess`, `isWarning`, `isDanger`, `isSelected`; `isEyebrowHeading` (`true`, or `1`–`3` for the heading level) renders it as an eyebrow label; `icon` and `appendIcon` via `withIcon`. `PinkTag.Tag` is the same component with `is` exposed, for a tag that must be another element.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinktag--variants)

## `PinkInteractiveTag`

`PinkTag` as a control: a `<button type="button">`, or an `<a>` when `href` is given, with `disabled` for the button form. Takes every `PinkTag` flag.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkinteractivetag--interactive-tag)

## `PinkLoader`

The spinner. By default it rotates; with `isLoading` it becomes a progress ring filled to `percent` (0–100). `isSmall` shrinks it, `isTransparent` removes the track color (ignored while `isLoading`). The `loader` class owns the visual, so this is the one element that takes no `className`.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinkloader--main)

## `PinkStatus`

A status dot with a label. `status` is a `PinkStatusState` — `Complete`, `Failed`, `Pending`, `Processing`, `Warning` — and doubles as the label unless `text` is given.

```ts
import { component } from '@loom-js/core';
import { PinkStatus, PinkStatusState } from '@loom-js/pink';

export const DeployState = component<{ ok: boolean }>(
    (html, { ok }) => html`
        <${PinkStatus}
            status=${ok ? PinkStatusState.Complete : PinkStatusState.Failed}
            text=${ok ? 'Deployed' : 'Deploy failed'}
        />
    `
);
```

[Stories](https://loom-js-pink.vercel.app/?path=/story/elements-pinkstatus--complete)

## `PinkTooltip`

A `<button type="button">` that shows a tooltip on hover and focus: `withTooltip` for the popup (`popupMessage`, `isBottom`, `isCenter`, `isEnd`, `popupClassName`) and `withIcon` for an icon, with `isTag` to style the button as a tag. For a tooltip on an element of your own, use the [`withTooltip` modifier](/docs/pink-composition#with-tooltip) directly.

`PinkTooltipPopup` — the bubble itself, a `<span role="tooltip" class="tooltip-popup">` with the same placement flags — is exported for components that render their own `.tooltip` host.

[Story](https://loom-js-pink.vercel.app/?path=/story/elements-pinktooltip--variants)
