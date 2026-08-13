## 1. Groundwork

- [ ] 1.1 Record core bundle baseline (min+gzip); Audit Rule check (`get-attr-update.ts` 🟡 OCP entry noted — not resolved here, additions conform to existing structure)
- [ ] 1.2 Verify the docs migration path (design D5): does a `className` binding object survive `DocContainer` → `PinkContainer` down to a real attr slot? If not, settle the fallback shape and update design.md before implementing

## 2. Red — specs first (tdd-workflow)

- [ ] 2.1 Failing specs: standard-attr binding applies immediately, tracks updates, preserves node identity, and does not re-run the component body
- [ ] 2.2 Failing specs: `$attrs`-entry binding behaves as live while sibling entries stay static
- [ ] 2.3 Failing specs: re-render swap disposes the previous subscription (N re-renders → one attribute change per update); unmount releases the binding (no update after detach)

## 3. Green — implementation

- [ ] 3.1 `types.ts` + `activity.ts`: `AttrBinding` type (symbol-marked) and `bind(select?)` method
- [ ] 3.2 `get-attr-update.ts`: `applyAttrBinding` helper + recognition in the standard-attr updater and the `$attrs` per-entry path, with per-slot swap disposal and `ctx.teardowns` registration (design D2–D4)
- [ ] 3.3 Full core suite green; `type-check` + `type-check-tests`
- [ ] 3.4 Migrate the docs TOC to `bind` per the verified D5 path; remove the mount-scoped watch from `DocsLayout`; `pnpm -F @loom-js/loom type-check`

## 4. Verification

- [ ] 4.1 Browser: TOC toggle still class-only with node identity preserved; balanced across docs re-entries; side nav unaffected
- [ ] 4.2 Rebuild core; record min+gzip delta vs. baseline
- [ ] 4.3 Document `bind` in `packages/core/README.md` (API surface + when to prefer it over `effect`/`watch`)

## 5. Bookkeeping

- [ ] 5.1 Changeset for `@loom-js/core` (minor — additive `bind` API)
- [ ] 5.2 `pnpm format` + `format:check` clean
