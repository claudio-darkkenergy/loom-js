# Tasks — fragment-root-inference

## 1. Gate

- [x] 1.1 Confirm `docs-ia-discoverability` has published (its `fragments` topic documents `<>` as it stands; this change revises it through parity) — hard stop before content edits, not before core work _(cleared 2026-09-27: `fragments` entry published in Contentful at 07:10Z, no pending draft; change archived)_

## 2. Parser and compiler (TDD: red → green per D1–D4)

- [x] 2.1 Root-form specs (red): single element with surrounding whitespace → single root; multiple elements / element + text / top-level comment → fragment; lone top-level interpolation renders; component-only template renders with no `<>` in statics; no code path recognizes a leading `<>`
- [x] 2.2 `html-parser.ts`: replace the `isTemplateFragment` regex + text-node strip with post-parse classification (whitespace-only text ignored), cached per template per document; honour `plan.fragment`; no `<>` handling remains (D1, D3, D4)
- [x] 2.3 `compile-component-tags/index.ts`: delete the component-only `statics[0]` rewrite; `emit.ts`: set `fragment: true` on synthesized region plans instead of prefixing (D2); plan type gains the flag
- [x] 2.4 Migrate the 12 `<>` fixture usages (`tests/support/components/fragments.ts`, `fragment-array-reconciliation`, `lazy-import`, `custom-element`, `component/life-cycles`, `compile-component-tags/plan`) — `SingleNodeFragment` becomes a single-root case per D6; `plan.spec` asserts no prefix

## 3. Types (D5)

- [x] 3.1 Type-level tests (red) under `tests/types/`: required-props `component<…>`, `simple<…>`, and a plain function in the tag position; a `number`-returning function rejected; an `AttrBinding` entry inside `$attrs`
- [x] 3.2 `types.ts`: `ComponentCallable` (bivariant) in `TemplateTagValueBase`; `AttrBinding` admitted in `AttrsTemplateTagValue` entries; `pnpm -F @loom-js/core type-check` + `type-check-tests` green

## 4. Server parity

- [x] 4.1 Server test: the whitespace-led fragment template renders identically under linkedom, jsdom and Happy DOM with no `&lt;&gt;` artifact (`tests/server/`)

## 5. Docs parity (after 1.1)

- [x] 5.1 README `### Fragments`: "The `<>` token" → "Root forms" (no token; comment/text/dynamic-slot roots); update Components ¶3, `node()` bullet, the Composing components inference paragraph, and the `Pair` examples; drop `<>` from every README sample
- [x] 5.2 `fragments` topic source (`05a-fragments.md`): same restructure — h2 "The `<>` token" retired (redirect note in the content map), "Root forms and inference" absorbs it; `components` / `element-syntax` pointers re-worded; drafts pushed via `contentful-sync/push.py`; content map outline + registry updated _(2026-09-27: `components`, `element-syntax`, `fragments` pushed as drafts only — the three entries, not the full `push.py` sweep, so the other topics keep their published state)_
- [ ] 5.3 Standing draft review; publish the three topics together

## 6. Release and verification

- [x] 6.1 `@loom-js/core` changeset with a **BREAKING** note (`<>` removed; single-element fragments now single roots); `pnpm -F @loom-js/core test-ci` green (unit + server suites); `pnpm format`
- [x] 6.2 Update `template-component-syntax` cross-references if any remaining text names the token; sync `SOLID-AUDIT-REPORT.md` entries for touched files if open
