# @loom-js/pink

The design system for [loom](https://loom-js-docs.vercel.app) apps: a stylesheet, an icon font and a set of loom components that emit its class names. The stylesheet is Pink Design 1.0, continued from Appwrite's archived project (see `NOTICE`); the components, theming hook and code panels are loom's.

## Install

```bash
npm i @loom-js/pink
```

`@loom-js/core` is a peer dependency.

## Use

```ts
import { component } from '@loom-js/core';
import { PinkButton, PinkCard } from '@loom-js/pink';
import '@loom-js/pink/icons.css';
import '@loom-js/pink/pink.css';

export const SaveCard = component(
    (html) => html`
        <${PinkCard}>
            <p>Changes are kept locally until you save.</p>
            <${PinkButton} icon="icon-check" isSecondary>Save</>
        </>
    `
);
```

## Documentation

- [Pink on the docs site](https://loom-js-docs.vercel.app/docs/pink) — install, theming, and the component reference.
- [Storybook](https://loom-js-pink.vercel.app) — every component, light and dark.
