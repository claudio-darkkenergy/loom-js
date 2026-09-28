# Tasks — collapse-template-whitespace

## 1. Semantics (TDD)

- [x] 1.1 Red: unit specs for the newline rule — boundary runs removed, cross-line content runs → one space, same-line runs untouched, interpolation slots as content items, whitespace split across chunk boundaries, `pre`/`textarea` (and `pre` descendants) verbatim, table-scope markers treated as content
- [x] 1.2 Red: server-parity test — identical `renderToString` vs. browser markup for a whitespace-heavy template; hydration performs no correcting mutations
- [x] 1.3 Green: implement the collapse as a statics pass in `packages/core/src/lib/templating/` (pre-cache, post `compile-component-tags`), threading the tag-context (`pre`/`textarea`) through the scan
- [x] 1.4 Update existing core specs whose expected markup asserts formatting text nodes; full `test-ci` + `type-check` + `type-check-tests` green

## 2. Docs & release

- [x] 2.1 README templating section: the rule in three sentences (newline = formatting; one space between cross-line content; `pre`/`textarea` verbatim) — explicitly "no escape hatch"
- [x] 2.2 **Minor** `@loom-js/core` changeset with the DOM-shape note (fewer text nodes; snapshots change; visuals under normal CSS do not)
- [x] 2.3 `pnpm format` over touched files

## 3. Verification

- [x] 3.1 Docs app spot-check: inline code, code panels, headings, TOC render identically; DOM text-node count drops on a docs topic — checked by diffing the prerendered output of two prod builds (collapse off/on): all 17 pages keep the same elements and the same rendered text (inline/block-aware, `pre` compared verbatim); text nodes 17,513 → 12,804. Not eyeballed in a browser
- [x] 3.2 Follow-up recorded (not done here): restore `PinkInlineCode` to template form in a pink change once this ships — recorded in proposal (Impact) and design (Migration Plan)
