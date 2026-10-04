---
slug: pink
title: Pink
package: @loom-js/pink
---
`@loom-js/pink` is the design system for loom apps: a stylesheet, an icon font, and a set of loom components that emit its class names. The stylesheet is Pink Design 1.0, continued from Appwrite's archived project; the components, theming hook and code panels are loom's. This topic covers what the package is, how to install it, and where its theming surface sits.

## What pink is

Three things ship in one package:

- **A stylesheet** — `pink.css`, compiled from the SCSS source kept in the package. It carries the design tokens as CSS custom properties, the resets, the elements (`button`, `card`, `tag`…), the components (`code-panel`, `collapsible`, `side-nav`…), the grids and the utility classes.
- **An icon font** — `icons.css`, 358 glyphs addressed as `icon-*` classes (`icon-plus`, `icon-cheveron-down`). Components take an icon by class name.
- **Loom components** — `PinkButton`, `PinkCard`, `PinkTable`, `PinkCodePanel` and the rest, each a thin layer that puts the right classes on the right element and threads core's props through. Storybook is their live catalog.

The stylesheet is organized in cascade layers, in this order: `css-variables`, `resets`, `icons`, `animations`, `elements`, `components`, `grids`, `utilities`. Your own CSS is unlayered, so it wins over every pink rule without a specificity fight.

## Origin

Pink Design was Appwrite's design system. When the upstream project was archived at 1.0.0, its SCSS source and icon set were adopted into this package, so pink is self-contained — no `@appwrite.io/*` dependency — and free to evolve. The package's `NOTICE` carries the MIT license, the source commit, and the notices of the reset libraries compiled into the stylesheet. Pink is pre-1.0: the component surface may move between minor versions.

## Install

```bash tab=npm group=pm
npm i @loom-js/pink
```

```bash tab=yarn group=pm
yarn add @loom-js/pink
```

```bash tab=pnpm group=pm
pnpm add @loom-js/pink
```

`@loom-js/core` is a peer dependency.

## Inclusion

Two stylesheet imports and the component import, typically in the app's entry:

```ts
import '@loom-js/pink/pink.css';
import '@loom-js/pink/icons.css';

import { PinkButton } from '@loom-js/pink';
```

`icons.css` is separate so an app that brings its own icons can skip the font. The stylesheet references its font files by relative URL; `@loom-js/build` and any bundler with a file loader for `.woff2` handle them.

Components are used like any loom component — in element syntax or called as functions:

```ts
import { component } from '@loom-js/core';
import { PinkButton, PinkCard } from '@loom-js/pink';

export const SaveCard = component(
    (html) => html`
        <${PinkCard}>
            <p>Changes are kept locally until you save.</p>
            <${PinkButton} icon="icon-check" isSecondary>Save</>
        </>
    `
);
```

[Composing](/docs/pink-composition) covers the props every component shares.

## Theming

### Theme classes

Pink ships a light theme as the default and a dark theme behind one class: put `theme-dark` on `<body>` (or any ancestor) and every token flips. With `@loom-js/build`, `html.bodyClass: 'theme-dark'` sets it in the shell so the prerendered markup is dark before any script runs.

### `usePinkTheming`

`usePinkTheming(config)` turns a handful of named knobs into an inline `style` for the app root. Each knob is a CSS custom property the stylesheet reads with a fallback, so one call themes the whole subtree in either theme:

```ts
import { component } from '@loom-js/core';
import { usePinkTheming } from '@loom-js/pink';

const theme = usePinkTheming({
    headingFont: 'Pelinka-ExtraBold',
    contentFont: 'Pelinka-Regular',
    colorPrimary1: '301 58% 46%',
    cardBorderRadius: '0.5rem'
});

export const App = component(
    (html, { children }) => html`
        <div id="layout" style=${theme.style}>${children}</div>
    `
);
```

| Knob | What it sets |
| --- | --- |
| `headingFont`, `contentFont` | The two font stacks. |
| `colorPrimary1`, `colorPrimary2`, `colorPrimary3` | The brand color at its three steps (`--color-primary-100/200/300`). |
| `colorBorder` | The default border color. |
| `textColor` | The page text color for the root's subtree. |
| `cardBgColor`, `cardBorderRadius`, `cardPadding`, `cardPaddingMobile` | The card's background, radius and padding (`cardPaddingMobile` takes over at pink's first breakpoint). |
| `avatarBgColor` | The default avatar background. |

Colors are HSL triplets without the function — `'343 87% 56%'` — because the stylesheet wraps every color variable in `hsl()`. Fonts and lengths are plain CSS values.

### CSS variables

The knobs are conveniences; the real surface is the custom properties. `--color-*` tokens (`--color-neutral-5` … `--color-neutral-105`, `--color-primary-*`, `--color-information-*`, `--color-success-*`, `--color-warning-*`, `--color-danger-*`), `--font-size-*`, `--border-radius-*` and the per-component `--p-*` variables are all redefinable on any element, and a redefinition scopes to that subtree:

```css
.code-panel {
    --p-code-token-keyword: 325 100% 65%;
}
```

[Code Panels](/docs/pink-code-panels) lists the `--p-code-token-*` set; the other components' variables are named in the stylesheet source under `scss/`.

## Storybook

Every component has a story at [loom-js-pink.vercel.app](https://loom-js-pink.vercel.app), grouped as Elements, Components, Layout and Behaviors with a light/dark toggle in the toolbar. The topics in this section describe the props and the composition rules; Storybook is where you see the result.

## Where next

[Composing](/docs/pink-composition) is the one topic to read before the catalog: the shared props, the polymorphic root, the modifiers. Then [Elements](/docs/pink-elements), [Components](/docs/pink-components) and [Layout](/docs/pink-layout) are reference, and [Code Panels](/docs/pink-code-panels) covers the one component with its own wiring.
