## 1. Groundwork

- [ ] 1.1 Audit Rule check: no open entries for `pages/docs/layout.ts` (its SRP entry is ✅ Resolved) or `DocsSideNav.ts`; confirm `pages/docs/**` still untouched by the element-syntax sweep's working tree
- [ ] 1.2 Confirm what the `...props` spread on `DocsLayout`'s root actually receives at runtime (design D2 assumes only inert route props beyond `children`/`className`)

## 2. Implementation

- [ ] 2.1 `DocsSideNav`: drop the `isOpen` prop; render initial `_open` from `sideNavToggle.value()`; register the mount-scoped `sideNavToggle.watch` → `classList.toggle` with unsubscribe folded into the existing `onUnmounted` handler (design D1/D3/D4)
- [ ] 2.2 `DocsLayout`: convert to `component()`; remove both toggle-effect wrappers; render initial container `_open` from `topicTocToggle.value()`; register the mount-scoped `topicTocToggle.watch` targeting the `docContainer` element (D1–D4)
- [ ] 2.3 `pnpm -F @loom-js/loom type-check` — no new errors vs. baseline

## 3. Verification (browser, per D6 posture)

- [ ] 3.1 Side-nav and TOC toggles flip classes with node identity preserved (JS: capture element, toggle, `isSameNode` + class assertion) and no contentful request
- [ ] 3.2 Enter/leave docs 3+ times, then toggle each once — exactly one class transition; manual toggle state persists across re-entry; breakpoint-driven resync still works (media-query update path)
- [ ] 3.3 Docs pages render correctly end-to-end: redirect, topic navigation (one fetch on first visit, cache on revisit), side-nav selection highlighting

## 4. Bookkeeping

- [ ] 4.1 No changeset needed (`@loom-js/loom` private); update the `layout.ts` audit note only if the conversion changes its SRP posture (it should not)
- [ ] 4.2 `pnpm format` + `format:check` clean
