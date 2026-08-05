## Why

Composing components in loom templates is hard to read, because every composed component is a function call inside an interpolation slot, and props that hold components nest those calls. From `apps/loom/src/app/pages/layout.ts`:

```ts
${PinkGridHeader({
    className: classNames(styles.header, 'body-text-1 u-padding-16'),
    gridCol1: {
        is: () => Div({
            className: classNames('u-flex u-gap-8', styles.headerCol1),
            children: layoutStateEffect(({ value: { sideNav } }) => [
                PinkButton({ className: …, icon: 'icon-menu', isOnlyIcon: true, onClick: … }),
                BrandLogoLink({})
            ])
        })
    },
    gridCol2: { is: PinkTopNav, className: styles.topNav, items: [ … ] }
})}
```

Four levels of call syntax and object literals express what is structurally just nested markup. The cost is concentrated in props whose values are components or arrays of components — not only `children`.

This proposal adds element syntax for composing components:

```ts
html`
    <${PinkButton}
        $isOnlyIcon
        icon="icon-menu"
        $onClick=${() => toggleSideNav(null)}
    />
`;
```

## What Changes

- **Add a transform pass at the front of `htmlParser`** that rewrites component-element syntax into the functional form loom already supports, _before_ the existing pipeline runs. The output target is `${Component({ …props })}` in text position — an already-supported composition form — so this is sugar over existing runtime semantics rather than a new runtime concept.

    ```
    chunks:  ['<', ' label=', ' $onClick=', '/>']   values: [Button, 'Click', fn]
                                    ↓ transform
    chunks:  ['', '']                                values: [Button({ label: 'Click', onClick: fn })]
                                    ↓ existing pipeline, unchanged
    chunks.join(TOKEN) → createContextualFragment → getPaths → setUpdatesForPaths
    ```

- **Detect component tags** by the one unambiguous signal available: a chunk ending in `<` or `</` immediately before an interpolation. Everything else falls through to `createContextualFragment` exactly as today.
- **Cache the transform per call site.** `templateCacheStore` is already keyed on `TemplateStringsArray` identity, and the language guarantees one stable identity per template-literal site, so the transform runs once per site for the life of the process.
- **Compile nested children into synthesized components** (see Decisions), never into bare nested `html` calls.
- **Support the prop forms** the functional syntax supports: interpolated values (`$prop=${value}`) carrying arbitrary JS (objects, arrays, functions), static string attributes, and boolean shorthand.
- **Named slots / `[slot]` content distribution**, so a component can accept more than one labelled content region rather than a single undifferentiated children payload. **Inherited 2026-08-04 from `fix-custom-element-registration` task 6.2**, which deferred it and had nowhere to put it; it lands here because it is the multi-region counterpart to the children compilation above, and both are content-distribution questions about the same authoring syntax. Note this covers `[slot]` distribution generally — not only the shadow-DOM `<slot>` element — since `defineElement` renders to the light DOM by default. Design is open; the prior art is the Open Questions section of `openspec/changes/archive/2026-08-04-fix-custom-element-registration/design.md`.

Non-goals: replacing the native HTML parsing of ordinary markup; custom-element registration (separate change, `fix-custom-element-registration`, which targets **interop** — letting non-loom pages consume loom components — not authoring ergonomics); any change to activity/effect semantics.

## Capabilities

### New Capabilities

- `template-component-syntax`: Components can be composed in loom templates using element syntax with attribute-style props, instead of nested function calls with object-literal props.

## Impact

- **Code:** `packages/core/src/html-parser.ts` (new transform pass), a new transform/parser module under `packages/core/src/lib/templating/`, `packages/core/src/types.ts`, `packages/core/README.md`.
- **Risk:** High — this touches the hottest code path in the framework. Mitigations: the transform is purely additive (templates with no component tags are byte-identical through the pipeline), it is cached once per call site, and its output is an existing supported form.
- **Bundle:** Adds a small scanner to a zero-runtime-dependency package. Budget it explicitly and measure.
- **Release:** Minor changeset — additive syntax, no existing behavior changes.
- **Verification:** `type-check`, `type-check-tests`, `test-ci`; new specs; and a before/after conversion of a real `apps/loom` template as the readability check.
