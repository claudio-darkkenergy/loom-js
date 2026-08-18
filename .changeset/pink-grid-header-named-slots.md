---
'@loom-js/pink': minor
---

`PinkGridHeader` now takes its columns as named slots instead of the `gridCol1`–`gridCol4` object props:

```ts
html`
    <${PinkGridHeader}>
        <h2 slot="col1" class="grid-header-col-1">Databases</h2>
        <${PinkButton} slot="col2" className="grid-header-col-2">…</>
    </>
`;
```

Breaking for `PinkGridHeader` consumers: the `gridColN` props (and their `is`/default-element indirection) are gone — label your own elements with `slot="col1"`…`slot="col4"` and place the pink grid classes (`grid-header-col-1`…`-4`) on them directly. `PinkGridHeaderProps` stays `Omit<HeaderProps, 'children'>`: native header attributes still pass through exactly as on a tags component (`attrs`, `on`, and top-level `className`/`id`/`style`).
