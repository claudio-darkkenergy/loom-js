# Tasks — table-aware-template-parsing

## 1. Failing specs first (Red)

- [x] 1.1 Browser-lane specs (`tests/unit/table-templates.spec.ts`): tr/td/section-rooted
      component templates keep their root; `el('tr')`/`el('td')` render their named element;
      dynamic row list inside `<tbody>` (and `el('table')({ children })`) renders in place with
      no leaked pre-table nodes; row-list updates reconcile in place; tokens inside `td`/`th`/
      `caption` and in attribute values on table parts behave as today
- [x] 1.2 Server-lane test (`tests/server/`): `renderToString` of the same table templates
      against linkedom serializes the browser-expected markup
- [x] 1.3 Confirm the new specs fail on current core for the right reasons (stripped roots /
      foster-parented tokens), and existing suites still pass untouched

## 2. Table-scope scanner

- [x] 2.1 Add `packages/core/src/lib/templating/table-scope.ts`: given the final statics,
      report (a) whether the template contains table-part tags, (b) whether the root is a
      table-part, and (c) which token positions are table-content (inside `table`/sections/
      `tr`/`colgroup` but not `td`/`th`/`caption`), tag- and attribute-boundary aware (reuse
      `compile-component-tags` grammar patterns where they fit)
- [x] 2.2 Unit specs for the scanner: attribute tokens on table parts, quoted `>` in attribute
      values, `td`/`th`/`caption` interiors, nested tables, no-table fast path

## 3. Parser integration (Green)

- [x] 3.1 `html-parser.ts`: when the scanner reports table markup, emit `<!--⚡-->` for
      table-content token positions and parse via a `<template>` element (`.content` becomes
      the cached fragment); otherwise keep the existing `createContextualFragment` path
      byte-identical
- [x] 3.2 `set-updates-for-paths.ts`: enable the `Comment` dynamic-node branch — replace the
      comment clone with a token text node at wire time, then reuse the existing live-text
      machinery; widen `DynamicNode` typing as needed
- [x] 3.3 All new specs green in both lanes; full core suite green
      (`pnpm -F @loom-js/core test-ci`)

## 4. Verification & release

- [x] 4.1 Refactor pass: scanner and parser additions follow templating module conventions;
      `pnpm -F @loom-js/core type-check` and `type-check-tests` green; `pnpm format` over
      touched files
- [x] 4.2 Manually verify the healed consumer path: a Contentful rich-text table (via
      `lib/contentful` default renderers) renders as a real table in the docs app
- [x] 4.3 Patch changeset for `@loom-js/core`; update `.claude/skills/skill-config.md`
      (templating notes) per the Skill Config Rule
