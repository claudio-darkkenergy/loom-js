# Tasks: Dedupe Route CSS Loading

## 1. Plugin: skip dynamic-chunk CSS bundles

- [x] 1.1 In `packages/esbuild/esbuild-plugin-html-split/src/html-split.mts`, before the output-classification reduce, collect the set of `cssBundle` paths from dynamically-imported JS outputs (targets of a `kind: 'dynamic-import'` edge — the "no `entryPoint`" predicate from the design didn't hold: esbuild marks dynamic chunks as sub-entry points; design.md updated); normalize them with `getResourcePath` alongside the existing paths
- [x] 1.2 Skip any CSS output whose path is in that set — it must land in neither `css` nor `common.css`
- [x] 1.3 Confirm entry CSS bundles (`spa.css`) and CSS entry points (`base.css`) still classify exactly as before, in both the SPA branch and the multi-entry branch
- [x] 1.4 `pnpm -F esbuild-plugin-html-split type-check` (and `build-package` if present) passes — package has neither script; direct `tsc --noEmit` shows no errors from this change (two pre-existing unused-option TS6133s)

## 2. App template: narrow scope filter to JS

- [x] 2.1 In `apps/loom/project/client/template.html.mts`, apply `includeResource` to JS only and stop filtering `common.css`; update the comment to note CSS arrives pre-deduped/unscoped from the plugin
- [x] 2.2 `pnpm -F @loom-js/loom type-check` passes

## 3. Verify against fresh builds

- [x] 3.1 Run a fresh `pnpm -F @loom-js/loom build`; assert every generated shell (`build/index.html`, `build/docs/index.html`) links `spa.css` and `base.css` and no `pages-*.css` / `docs-*.css` — verified for both the dev superset build and a `NODE_ENV=production` scoped build (prod shells also correctly exclude the other route's JS)
- [x] 3.2 Concatenate the linked stylesheets for the docs shell and confirm `styles_docContainer` rules occur only in `spa.css`, matching the count in the source `styles.module.css` — 2 occurrences in `spa.css`, 0 in `base.css`, matching the 2 source selectors (the unlinked `docs-*.css` still holds its redundant copy but nothing references it)
- [x] 3.3 Start the dev server, load `/` and `/docs/<a-topic>`, hard-reload both; confirm no console module-load errors and styles render correctly — verified on an isolated dev instance (port 9093) since the session's running dev server predated the plugin change; `/` and `/docs/get-started` both render correctly with zero console errors after hard reload
- [x] 3.4 In devtools on a topic TOC link, confirm each matching rule block appears exactly once (duplication gone) — programmatic sweep of all `document.styleSheets` rules matching the "Get Started" TOC link (`drop-button is-selected`): 12 matching rules, zero duplicates, only `spa.css` + `base.css` loaded
