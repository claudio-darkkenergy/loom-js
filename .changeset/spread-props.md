---
'@loom-js/core': minor
---

Component elements now accept spread props — `...${object}` in the attribute region spreads an interpolated object's entries into the props, exactly like the functional form always could:

```ts
const PinkGridHeader = component<PinkGridHeaderProps>(
    (html, { attrs, className, id, on, slots, style }) => html`
        <${Header}
            ...${{ attrs, id, on, style }}
            className=${classNames(className, 'grid-header')}
        >
            ${slots?.col1}
        </>
    `
);
```

Spreads and named props apply with object-literal semantics: authored order, last-wins duplicates — `<${Header} ...${headerProps} className=${x}>` behaves exactly like `Header({ ...headerProps, className: x })`. Nullish and primitive spread values are a render-time no-op, matching `{ ...null }` in JS. A `slot` key inside a spread object arrives as an ordinary prop, never as a slot label (labels resolve at transform time), and markup-derived `children`/`slots` still win over spread-supplied ones. `...` anywhere other than immediately before an interpolation throws at transform time.
