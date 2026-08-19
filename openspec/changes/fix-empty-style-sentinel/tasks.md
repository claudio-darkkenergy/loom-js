# fix-empty-style-sentinel — tasks

## 1. Red (TDD)

- [x] 1.1 Extend `packages/core/tests/unit/attr-value-semantics.spec.ts` with failing specs for the four delta scenarios: empty-resolving style value leaves no `style` attribute and no `⚡` in serialized markup (attr-slot path); re-render dropping a property removes it; `$attrs` style entry replaces identically (drop + empty cases); array entries still merge within one application (guard, should already pass). Run `pnpm -F @loom-js/core test-ci` and confirm the new specs fail for the right reason.

## 2. Green

- [x] 2.1 In `get-attr-update.ts` `applyValue`, clear inline style at the top of the object and array style branches (design D1/D2), leaving `mergeAndSetStyleValues` and the string/default branch untouched (D3). → Landed via the `replaceInlineStyle` helper after D2 was amended: bare `removeAttribute('style')` raced Chrome's lazy style-attribute serialization (a pending flush resurrected the removed attribute as `style=""`); the helper clears via `cssText = ''` and prunes the empty attribute after applying, with the prune's `getAttribute` read forcing the flush.
- [x] 2.2 Apply the same clear-before-apply to the two style branches in `applyAttrsEntry`. → Same `replaceInlineStyle` helper.
- [x] 2.3 Full suite green: `pnpm -F @loom-js/core test-ci` (238 wtr + 23 server) ✓; `type-check` + `type-check-tests` ✓. Suite ran against a working tree shared with the concurrent `fix-fragment-array-reconciliation` and `unify-server-drain-on-settled` applies — all green together.

## 3. Pink workaround removal

- [x] 3.1 Revert `pink-button.ts` to the unconditional `style: [{ '--p-button-size': buttonSize, '--p-font-size': fontSize, '--padding-horizontal': padding }, style]` (design D4); drop the workaround comment. `pnpm -F @loom-js/pink type-check` ✓ (first run raced a concurrent core dist rebuild — clean on retry).
- [x] 3.2 Parity check at the motivating site. → Verified through the SSR path (temporary `renderToStringSync` probe, since deleted): bare `PinkButton` → `<button type="button" class="button">` — no `style` attribute, no `⚡`; with `buttonSize` → `style="--p-button-size:3rem"`. Core dist rebuilt first so pink consumed the fixed build.

## 4. Docs, specs, changesets

- [x] 4.1 Update the core README's attr/style documentation if it states merge semantics for style re-renders. → Verified: the README makes no claim about style re-render semantics (its `style` mentions are shadow-DOM `options.styles` and dehydrate docs) — no edit needed.
- [x] 4.2 Changesets: `fix-empty-style-sentinel-core.md` (`@loom-js/core` minor — replacement semantics + the dropped-property behavior change) and `fix-empty-style-sentinel-pink.md` (`@loom-js/pink` patch — workaround removal).
- [x] 4.3 Prettier ✓ (scoped to this change's files — a tree-wide `pnpm format` was deliberately avoided while two concurrent applies shared the working tree; all five files already clean). `SOLID-AUDIT-REPORT.md`: both touched files (`get-attr-update.ts` OCP, `pink-button.ts` LSP) are ✅ Resolved — no open violations.
