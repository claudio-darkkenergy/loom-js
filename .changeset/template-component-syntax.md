---
'@loom-js/core': minor
---

Components now compose in templates using element syntax with attribute-style props:

```ts
html`
    <${PinkButton}
        isOnlyIcon
        icon="icon-menu"
        onClick=${() => toggleSideNav(null)}
    />
`;
```

This is sugar over the existing `${Component({ … })}` composition form — the transform rewrites component tags before the native parser runs, once per template call site, with no new runtime semantics. Props come as boolean shorthand (`flag`), quoted static strings (`icon="icon-menu"`), and interpolated JS values passed by reference (`onClick=${fn}`); prop names are taken verbatim. Children go between the opening tag and the single closing form `</>`, reaching the component as its `children` prop in its own context. `key=${…}` participates in keyed reconciliation as usual. Malformed component syntax throws on first render, naming the offending construct, instead of silently mis-rendering. Templates without component tags pass through the pipeline byte-identical.

Also fixes a latent bug for rootless (`<>`) templates: a top-level dynamic slot left `ctx.root` referencing detached placeholder nodes, because the root node-list was captured before path wiring replaced them.
