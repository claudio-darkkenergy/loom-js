---
'@loom-js/pink': minor
---

Pink is converted to element syntax end to end, and the `@loom-js/tags` wrapper layer it sat on is retired — `@loom-js/tags` is no longer a dependency, and `packages/tags` is deleted from the repository.

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
