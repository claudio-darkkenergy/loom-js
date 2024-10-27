---
'@loom-js/loom': patch
'@loom-js/core': patch
'@loom-js/pink': patch
'@loom-js/tags': patch
---

@loom-js/loom:

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
