# Tasks — document-component-refs

## 1. README

- [ ] 1.1 Write the `#### Refs` subsection under Components: `createRef()`/`RefContext`, the `ref` reserved prop, what the creator gets (child `node()` + hooks), `ctxRefs()` creation-order iteration, when refs beat `node()`; example mirroring the tested pattern (D3)
- [ ] 1.2 Add the reserved-prop surface table to the `props` documentation with pointers to owning sections (D2); update the `props` sentence itself to name the utility getters
- [ ] 1.3 Extract-and-type-check the new example (accuracy spec's compile scenario); `pnpm format` over the README

## 2. Docs parity

- [ ] 2.1 Amend the content map: components outline gains the Refs section (placement per D1) + the prop-surface table note
- [ ] 2.2 Mirror the README additions into `topics/04-components.md`; re-push the draft; maintainer reviews with the standing draft set

## 3. Close

- [ ] 3.1 Verify against the modified requirement: every `UtilityProps`/`ReservedProps`/`RefContext` member documented or excluded on record in this change
