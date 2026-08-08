---
'@loom-js/core': minor
---

Components can now receive multiple labelled content regions — named slots. A top-level child of a component element carrying a `slot="name"` label is grouped into that region and delivered as `props.slots.name`, with the unlabelled remainder staying ordinary `children`:

```ts
const Card = component(
    (html, { children, slots }) => html`
        <article>
            <header>${slots?.header}</header>
            <div>${children}</div>
        </article>
    `
);

html`
    <${Card}>
        <h2 slot="header">Title</h2>
        <p>Body</p>
    </>
`;
```

The functional form is the same call the element syntax compiles to: `Card({ slots: { header: … }, children: … })`. Distribution is loom's in the light DOM only — `slot` attributes nested deeper than the region's top level (e.g. children of a shadow-rooted custom element) keep their native meaning and pass through untouched. Malformed labels (`slot=${name}`, valueless, unquoted, or empty) throw at transform time.

Also fixes a latent fragment bug this feature surfaced: an array-valued interpolation at the top level of a fragment template (e.g. a named region forwarded into another component element's children) silently dropped its nodes — insertion now anchors on `parentNode`, which a `DocumentFragment` provides, instead of `parentElement`, which it does not.
