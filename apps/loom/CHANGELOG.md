# @loom-js/loom

## 0.0.12

### Patch Changes

- Updated dependencies [9e78b34]
- Updated dependencies [b0d0d35]
- Updated dependencies [542dd65]
- Updated dependencies [d032619]
- Updated dependencies [2f3f84c]
- Updated dependencies [b547065]
- Updated dependencies [b547065]
- Updated dependencies [406c309]
- Updated dependencies [9def3e9]
- Updated dependencies [b8f994b]
- Updated dependencies [d032619]
- Updated dependencies [00a0855]
- Updated dependencies [64c8ea2]
- Updated dependencies [9cc3552]
- Updated dependencies [4d3625c]
    - @loom-js/core@0.7.0
    - @loom-js/pink@0.2.1
    - @loom-js/contentful@0.0.6
    - @loom-js/utils@0.0.4

## 0.0.11

### Patch Changes

- Updated dependencies [b7a1eb7]
- Updated dependencies [b7a1eb7]
- Updated dependencies [b7a1eb7]
    - @loom-js/pink@0.2.0

## 0.0.10

### Patch Changes

- Updated dependencies [a32352e]
- Updated dependencies [15a96de]
- Updated dependencies [fc33c15]
- Updated dependencies [b61b1d6]
- Updated dependencies [cc42b73]
- Updated dependencies [cc42b73]
- Updated dependencies [cc11703]
- Updated dependencies [c427e40]
- Updated dependencies [531d0de]
- Updated dependencies [d563e70]
- Updated dependencies [9cc3f3a]
- Updated dependencies [e309b37]
- Updated dependencies [a2ca4d2]
- Updated dependencies [2b57903]
- Updated dependencies [cff15a9]
- Updated dependencies [37833ac]
- Updated dependencies [78975d7]
    - @loom-js/core@0.6.0
    - @loom-js/pink@1.0.0
    - @loom-js/contentful@0.0.5
    - @loom-js/utils@0.0.3

## 0.0.9

### Patch Changes

- 8d36e85: @loom-js/loom:

    - Set custom style of italic node in rich text component & some minor cleanup.
    - Fixed the width of the side nav skeleton loader.
    - Update aside & side navigation behavior - will be scrollable when nav is taller than the screen & sticky when scrolling main content.
    - Add Github logo SVG to the layout header.
      @loom-js/core:
    - Update attribute update logic for style attribute - will now call `style.setProperty` when the property value is zero.
      @loom-js/pink:
    - `PinkSideNav` now uses `Nav` instead of `Div` as its default dynamic root node - updated for better semantics.
    - Add `display: contents` to `PinkTopNav` to more easily style their contents for flex alignment.
      @loom-js/tags:
    - Cleanup (remove) expected prop `title` from `Link` - can be passed w/ prop`attrs`.

    Add new environment variable for setting the Contentful GraphQL query variable for fetching preview vs. published content & connect them to the appropriate environments.

- Updated dependencies [8d36e85]
    - @loom-js/core@0.5.2
    - @loom-js/pink@0.1.2
    - @loom-js/tags@0.0.18
    - @loom-js/contentful@0.0.4
    - @loom-js/utils@0.0.2

## 0.0.8

### Patch Changes

- 6d793fb: Point to Contentful asset URL in app.
- Updated dependencies [6d793fb]
    - @loom-js/contentful@0.0.3

## 0.0.7

### Patch Changes

- 97df6b7: New utils, app enhancements, core fixes, and pink improvements.
- Updated dependencies [97df6b7]
    - @loom-js/core@0.5.1
    - @loom-js/pink@0.1.1
    - @loom-js/utils@0.0.1
    - @loom-js/contentful@0.0.2
    - @loom-js/tags@0.0.17

## 0.0.6

### Patch Changes

- Updated dependencies [41f2d14]
    - @loom-js/core@0.5.0
    - @loom-js/pink@0.1.0
    - @loom-js/tags@0.0.16
    - @loom-js/contentful@0.0.1
