## Why

A component that forwards props to a child component element must enumerate every forwarded name — `PinkGridHeader` composes `<${Header}>` by spelling out `attrs=${attrs} className=${…} id=${id} on=${on} style=${style}` because element syntax has no spread. The functional form always had one (`Header({ ...headerProps })`), so passthrough components are currently the one composition shape where element syntax is strictly worse. The parent change anticipated this: its Accepted Grammar deliberately made `...${props}` **throw** ("Deliberately excluded from v1 … so adding it later is non-breaking"), and the `add-named-slots` conversion produced the first concrete motivating case. This is also the enabler for `element-syntax-first` — pink cannot migrate its passthrough components onto element syntax ergonomically without it.

## What Changes

- **Spread props**: `...${object}` is accepted in a component element's attribute region and compiles to a source-order spread into the props object — `<${Header} ...${headerProps} className=${x}>` behaves exactly like `Header({ ...headerProps, className: x })`.
- **Object-literal semantics throughout**: spreads and named props apply in authored order with last-wins duplicates (the existing duplicate-name rule generalized); nullish/non-object spread values are a render-time no-op, exactly like `{ ...null }` in JS.
- **Transform-time constructs stay transform-time**: a `slot` key arriving via a spread object is an ordinary prop, never a region label (labels are grouped at transform time; spread values exist only at render time). Markup-derived `children`/`slots` keep their existing precedence — assigned after all props, spreads included.

Non-goals: spread on plain HTML elements (that channel is `$attrs`, which already exists); interpolation forms other than `...` immediately before an interpolation.

## Capabilities

### Modified Capabilities

- `template-component-syntax`: the attribute grammar gains the spread form; the malformed-syntax contract carves `...${…}` out of its throw list.

## Impact

- **Code:** `packages/core/src/lib/templating/compile-component-tags/` — `grammar.ts` (token), `scanner.ts` (attr region), `emit.ts` (spread step in the getter); specs under `tests/unit/compile-component-tags/`; `packages/core/README.md`.
- **Risk:** Low — additive to a construct that throws today, so no existing template changes behavior. Same hot-path guardrails as the parent changes: no-op guard untouched, explicit byte budget (set in tasks section 0 against the post-`add-named-slots` baseline of 9,850 B min+gzip).
- **Release:** Minor changeset for `@loom-js/core`.
- **Verification:** `test-ci`, `type-check`, `type-check-tests`; convert `PinkGridHeader`'s enumeration to a spread as the readability check.
