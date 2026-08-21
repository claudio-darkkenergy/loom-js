# @loom-js/pink

## 0.2.1

### Patch Changes

- b547065: `PinkButton` drops its conditional style-omission workaround and passes its custom-property style array through unconditionally — `@loom-js/core` now guarantees an empty-resolving style value leaves no `style` attribute behind. No API change.
- d032619: Migrate off `@loom-js/core`'s removed deprecated aliases (`ComponentProps` → `ComponentOutputProps`) and convert all pass-through components to core's new `simple()` factory, which guarantees implementations a props object under the new conditional props typing (all-optional-props components now accept propless calls). `PinkTag` keeps its `.Tag` property via `Object.assign`. No behavior change for existing callers.
- Updated dependencies [9e78b34]
- Updated dependencies [b0d0d35]
- Updated dependencies [542dd65]
- Updated dependencies [d032619]
- Updated dependencies [2f3f84c]
- Updated dependencies [b547065]
- Updated dependencies [406c309]
- Updated dependencies [9def3e9]
- Updated dependencies [b8f994b]
- Updated dependencies [00a0855]
- Updated dependencies [64c8ea2]
- Updated dependencies [9cc3552]
- Updated dependencies [4d3625c]
    - @loom-js/core@0.7.0

## 0.2.0

### Minor Changes

- b7a1eb7: Pink is converted to element syntax end to end, and the `@loom-js/tags` wrapper layer it sat on is retired — `@loom-js/tags` is no longer a dependency, and `packages/tags` is deleted from the repository.

    **Migration in one line:** compose in markup; where a component must travel as a value (an `is=` prop, a render callback, a props transformer), use core's `el(tagName)` — and pass arbitrary attributes/listeners through `attrs`/`on` instead of stray flat props.

    **Breaking changes:**

    - **`PinkDynamicProps` is honest now:** `is` is typed `Component` (the `| any` is gone) and the index signature is removed. Arbitrary attribute passthrough is the `attrs` prop; listeners are `on`. Stray flat keys no longer silently forward.
    - **`PinkGridBox` no longer forwards `item`/`itemProps` to a tags `Ul` root.** Callers author their items (e.g. map to `el('li')`-wrapped children).
    - **`PinkButton` props are local** (no tags `ButtonProps` inheritance). The root-element contract is documented on `href`: set → `<a>` root (takes `target`, default `_self`); unset → `<button>` root (takes `type` — now the literal union `'button' | 'reset' | 'submit'`, not the tags `ButtonType` enum — plus `disabled`, `title`, `aria`). Root-specific props on the other root are dropped, as the old code already did silently.
    - **`PinkInteractiveTag`** gains a typed `disabled`; its `attrs` entries override the root defaults (`type="button"` / `href` + `target="_self"`).
    - **List hosts own their markup:** `PinkButtonsList`, `PinkAvatarGroup`, `PinkDropList`, `PinkTabs`, and `PinkToggleButton` render owned `<ul>`/`<li>` templates. Their public `itemProps`/`listItemProps` APIs are unchanged, but tags-typed item shapes are replaced by local ones (`DropListItemProps`, `LinkItemProps`, avatar/toggle item props) — flat props outside those shapes no longer pass through.
    - **Prop types across the package** move from tags types (`DivProps`, `ImgProps`, `SpanProps`, `SectionProps`, `UlProps`, `LinkProps`) to core `ComponentInputProps`-based shapes; `withIcon`'s `iconProps` is `ComponentInputProps`.

    Every converted component is DOM-parity-proven byte-equal against its pre-conversion output.

    **For the `@loom-js/tags` owner** (run once, after this releases):

    ```
    npm deprecate '@loom-js/tags' 'Retired: element syntax in @loom-js/core replaces the tag wrappers — compose markup in component templates, and use core el(tagName) / RouteLink / Svg / Picture where an element must travel as a value. See the @loom-js/core README.'
    ```

    **Versioning note:** this release ships as **0.2.0**, not 1.0.0 — the registry holds an accidental `@loom-js/pink@1.0.0` from May 2024 (npm never lets a version number be reused, and that artifact is now deprecated), and the package deliberately stays pre-1.0 while in beta. Breaking changes land on minor bumps for as long as the 0.x line lasts.

- b7a1eb7: `PinkGridHeader` now takes its columns as named slots instead of the `gridCol1`–`gridCol4` object props:

    ```ts
    html`
        <${PinkGridHeader}>
            <h2 slot="col1" class="grid-header-col-1">Databases</h2>
            <${PinkButton} slot="col2" className="grid-header-col-2">…</>
        </>
    `;
    ```

    Breaking for `PinkGridHeader` consumers: the `gridColN` props (and their `is`/default-element indirection) are gone — label your own elements with `slot="col1"`…`slot="col4"` and place the pink grid classes (`grid-header-col-1`…`-4`) on them directly. `PinkGridHeaderProps` stays `Omit<HeaderProps, 'children'>`: native header attributes still pass through exactly as on a tags component (`attrs`, `on`, and top-level `className`/`id`/`style`).

### Patch Changes

- b7a1eb7: `PinkGridHeader` forwards its header props to `Header` via the new spread form (`...${{ attrs, id, on, style }}`) instead of enumerating them. No behavior change — the rendered DOM is byte-identical — but this release requires a `@loom-js/core` with spread-prop support.

## 0.1.2

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
    - @loom-js/tags@0.0.18

## 0.1.1

### Patch Changes

- 97df6b7: New utils, app enhancements, core fixes, and pink improvements.
- Updated dependencies [97df6b7]
    - @loom-js/core@0.5.1
    - @loom-js/tags@0.0.17

## 0.1.0

### Minor Changes

- 41f2d14: Significant updates to core routing including refactoring exports into a class-based singleton & adding `createRoutes` which sets up app routing for pages using lazy loading, supporting code splitting.

    Pink Storybook stories completed for existing & newly added pink components while fixing a bunch of type errors and successful deployed builds.

    Added a new block component, footer, to tags' blocks.

### Patch Changes

- Updated dependencies [41f2d14]
    - @loom-js/core@0.5.0
    - @loom-js/tags@0.0.16

## 0.0.15

### Patch Changes

- 1203343: Build fixes & more pink stories.
- Updated dependencies [1203343]
    - @loom-js/core@0.4.1
    - @loom-js/tags@0.0.15

## 0.0.14

### Minor Changes

- d4c1db8: Storybook added for @loom-js/pink & other minor updates

### Patch Changes

- Updated dependencies [d4c1db8]
    - @loom-js/core@0.4.0
    - @loom-js/tags@0.0.14

## 0.0.13

### Patch Changes

- 6937dc7: Resolve distribution files for inclusion
- Updated dependencies [6937dc7]
    - @loom-js/core@0.3.28
    - @loom-js/tags@0.0.13

## 0.0.12

### Patch Changes

- f6da399: CI & Package fixes.
- Updated dependencies [f6da399]
    - @loom-js/core@0.3.27
    - @loom-js/tags@0.0.12

## 0.0.11

### Patch Changes

- 6f3451c: Get all packages and apps to play well together in a monorepo setting using turbo repo for task orchistration.
- 8f1c5a0: Get all packages and apps to play well together in a monorepo setting using turbo repo for task orchistration.
- Updated dependencies [6f3451c]
- Updated dependencies [8f1c5a0]
    - @loom-js/tags@0.0.11
    - @loom-js/core@0.3.26
