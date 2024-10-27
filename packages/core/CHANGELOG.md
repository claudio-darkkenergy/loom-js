# @loom-js/core

## 0.5.2

### Patch Changes

-   8d36e85: @loom-js/loom:

    -   Set custom style of italic node in rich text component & some minor cleanup.
    -   Fixed the width of the side nav skeleton loader.
    -   Update aside & side navigation behavior - will be scrollable when nav is taller than the screen & sticky when scrolling main content.
    -   Add Github logo SVG to the layout header.
        @loom-js/core:
    -   Update attribute update logic for style attribute - will now call `style.setProperty` when the property value is zero.
        @loom-js/pink:
    -   `PinkSideNav` now uses `Nav` instead of `Div` as its default dynamic root node - updated for better semantics.
    -   Add `display: contents` to `PinkTopNav` to more easily style their contents for flex alignment.
        @loom-js/tags:
    -   Cleanup (remove) expected prop `title` from `Link` - can be passed w/ prop`attrs`.

    Add new environment variable for setting the Contentful GraphQL query variable for fetching preview vs. published content & connect them to the appropriate environments.

## 0.5.1

### Patch Changes

-   97df6b7: New utils, app enhancements, core fixes, and pink improvements.

## 0.5.0

### Minor Changes

-   41f2d14: Significant updates to core routing including refactoring exports into a class-based singleton & adding `createRoutes` which sets up app routing for pages using lazy loading, supporting code splitting.

    Pink Storybook stories completed for existing & newly added pink components while fixing a bunch of type errors and successful deployed builds.

    Added a new block component, footer, to tags' blocks.

## 0.4.1

### Patch Changes

-   1203343: Array value render optimization using `key`.

## 0.4.0

### Minor Changes

-   d4c1db8: Storybook added for @loom-js/pink & other minor updates

## 0.3.28

### Patch Changes

-   6937dc7: Resolve distribution files for inclusion

## 0.3.27

### Patch Changes

-   f6da399: CI & Package fixes.

## 0.3.26

### Patch Changes

-   8f1c5a0: Get all packages and apps to play well together in a monorepo setting using turbo repo for task orchistration.
