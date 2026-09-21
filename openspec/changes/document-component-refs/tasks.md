# Tasks — document-component-refs

## 1. README

- [x] 1.1 Write the `#### Refs` subsection under Components: `createRef()`/`RefContext`, the `ref` reserved prop, what the creator gets (child `node()` + hooks), `ctxRefs()` creation-order iteration, when refs beat `node()`; example mirroring the tested pattern (D3)
- [x] 1.2 Write the **Built-in props** section per D2: one prose entry per reserved prop and utility (definitions here, depth pointed to; `children` defined here with Element Syntax keeping authoring mechanics; `own()` defined here pointing at Component-scoped state — landed by `component-instance-state`); shrink the template-function `props` bullet to a pointer; close the section with its See also block (manually seeded per D2)
- [x] 1.3 Extract-and-type-check the new example (accuracy spec's compile scenario); `pnpm format` over the README — the compile pass surfaced the `TemplateTagValue`/`RefContext` typing gap; fixed type-only with a **patch** changeset (user-approved), full suite + both type-checks green

## 2. Docs parity

- [x] 2.1 Amend the content map: components outline gains the Built-in props section (Refs nested, placement per D1) + the prop-surface table note
- [x] 2.2 Mirror the README additions into `topics/04-components.md`; re-push the draft (components entry v963); maintainer reviews with the standing draft set

## 3. Close

- [x] 3.1 Verify against the modified requirement: every `UtilityProps`/`ReservedProps`/`RefContext` member documented or excluded on record in this change — verified 2026-09-20: `UtilityProps` 4/4 (`node`, `createRef`, `ctxRefs`, `own`) and `ReservedProps` 11/11 (`attrs`, `children`, `className`, `id`, `key`, `on`, `onClick`, `ref`, `routeProps`, `slots`, `style`) documented; `RefContext`'s `node` + five hook setters documented, and its five inherited `LifeCycleHandlerProps` storage fields (`beforeRender`, `created`, `mounted`, `rendered`, `unmounted`) are **excluded on record** — internal handler slots the framework reads after the setters assign them; users only ever call the `on*` setters
