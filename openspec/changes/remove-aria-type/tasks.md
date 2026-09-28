# Tasks — remove-aria-type

## 1. Pink

- [x] 1.1 `PinkButton`: drop the `aria` prop, the `Aria` import, and the `aria-label` spread; update the root-element comment
- [x] 1.2 `PinkToggleButton`: drop `aria` from `ToggleButtonItemProps`, the `Aria` import, and the `aria-label` attribute
- [x] 1.3 Confirm no story or `apps/loom` call site passes `aria`; `pnpm -F @loom-js/pink type-check` green

## 2. Core

- [x] 2.1 Delete the `Aria` interface from `types.ts` and its export (with the comment) from `index.ts`; confirm it is absent from the built `index.d.ts`
- [x] 2.2 `type-check`, `type-check-tests`, and `test-ci` green

## 3. Release

- [x] 3.1 **Minor** `@loom-js/core` changeset stating the `Aria` removal
- [x] 3.2 **Minor** `@loom-js/pink` changeset stating the `aria` prop removal and that ARIA attributes go through `attrs`
