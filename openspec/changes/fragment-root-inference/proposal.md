# Fragment Root Inference

## Why

A template's root shape is already visible to the parser — one element, or several top-level nodes — yet authors must announce it with a `<>` prefix, and the token carries three defects found while documenting fragments (`docs-ia-discoverability`, 2026-09-26): under linkedom a whitespace-led `<>` leaks into server output as `&lt;&gt;` (the docs prerender runs on linkedom), a lone top-level interpolation without `<>` silently renders nothing, and the compiler has to prepend `<>` itself for component-only templates. The same pass found two typing gaps that contradict documented behavior: any component callable with required props is rejected in the tag position, and `$attrs` entries can't be typed as `bind()` values although the runtime and the `reactive-attr-bindings` spec both support them.

## What Changes

- **BREAKING** — the `<>` token is removed from the authoring surface. The parser infers the root form from the parsed template: exactly one top-level element (whitespace-only text ignored) is a single-rooted template; anything else — several top-level nodes, top-level text, or a top-level dynamic slot — is a fragment-rooted template. A leading `<>` is no longer recognized — it is ordinary template text like any other characters.
- A lone top-level interpolation (`` html`${Child()}` ``) becomes a valid fragment root and renders its value, instead of rendering nothing.
- Component-only templates need no compiler-inserted prefix; the compile step stops rewriting `statics[0]`. Internal children/slot regions stop using the string token as their fragment signal and pass an explicit flag instead.
- The linkedom `<>` leak disappears with the token; a server-render regression test pins fragment output across the verified DOM implementations.
- **Types:** `TemplateTagValue` admits component callables with required props in the tag position (`<${Card} heading="…" />` type-checks for `component<…>`, `simple<…>`, and plain functions alike); `AttrsTemplateTagValue` entries admit `AttrBinding`.
- Test fixtures and specs drop `<>`; docs follow via parity: the `fragments` topic's "The `<>` token" and "Root forms and inference" sections, the Components / Element Syntax pointers, and the README `### Fragments` section.

## Capabilities

### New Capabilities

- `template-root-forms`: the root-inference contract — how a template's top level is classified (single element vs. fragment), whitespace handling, the dynamic-slot root, what `node()` and life-cycle handlers receive for each form, and that no authoring token participates.

### Modified Capabilities

- `custom-element-registration`: the fragment-root requirement stops naming the `<>…</>` syntax — a registered component with multiple top-level nodes remains instantiable, however the template is written.
- `core-type-surface`: adds the two typing requirements — required-props component callables are valid `TemplateTagValue`s (tag position), and `$attrs` entries accept `AttrBinding`.
- `server-rendering`: adds the requirement that fragment-rooted templates serialize identically across the verified DOM implementations, with no token artifact.

## Impact

- `packages/core/src/html-parser.ts` (root classification, `<>` strip removed), `src/lib/templating/compile-component-tags/{index,emit}.ts` (no `<>` insertion; explicit region flag), `src/types.ts` (`TemplateTagValue`, `AttrsTemplateTagValue`).
- `packages/core/tests` — 12 `<>` usages across 6 files (`fragments.ts` fixtures, `fragment-array-reconciliation`, `lazy-import`, `custom-element`, `life-cycles`, `compile-component-tags/plan`) migrate; new root-form + server-parity + type-level tests. `apps/loom`, `packages/pink`, `packages/highlight` use no `<>` — no consumer migration in the repo.
- `packages/core/README.md` and the docs topics `fragments`, `components`, `element-syntax` (content map + Contentful drafts via the align change's `contentful-sync/`); a **major**-flavoured changeset for `@loom-js/core` (pre-1.0: minor bump with a BREAKING note per the repo's changeset convention).
- Sequenced after `docs-ia-discoverability` publishes (its fragments topic documents `<>` as it stands today; this change revises it through the standing parity task).
