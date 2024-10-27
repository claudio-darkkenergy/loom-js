# @loom-js/loom

## 0.0.9

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

-   Updated dependencies [8d36e85]
    -   @loom-js/core@0.5.2
    -   @loom-js/pink@0.1.2
    -   @loom-js/tags@0.0.18
    -   @loom-js/contentful@0.0.4
    -   @loom-js/utils@0.0.2

## 0.0.8

### Patch Changes

-   6d793fb: Point to Contentful asset URL in app.
-   Updated dependencies [6d793fb]
    -   @loom-js/contentful@0.0.3

## 0.0.7

### Patch Changes

-   97df6b7: New utils, app enhancements, core fixes, and pink improvements.
-   Updated dependencies [97df6b7]
    -   @loom-js/core@0.5.1
    -   @loom-js/pink@0.1.1
    -   @loom-js/utils@0.0.1
    -   @loom-js/contentful@0.0.2
    -   @loom-js/tags@0.0.17

## 0.0.6

### Patch Changes

-   Updated dependencies [41f2d14]
    -   @loom-js/core@0.5.0
    -   @loom-js/pink@0.1.0
    -   @loom-js/tags@0.0.16
    -   @loom-js/contentful@0.0.1
