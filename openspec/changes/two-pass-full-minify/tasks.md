# Tasks: Two-Pass Full Minify

## 1. Plugin

- [ ] 1.1 Add `twoPassCss?: boolean` to `HtmlSplitPluginOptions`; single-pass path byte-identical when off
- [ ] 1.2 Pass-2 orchestration: after analysis, one `esbuild.build` with parent `initialOptions` + synthetic shared/per-route CSS entries appended, html-split/clean/copy plugins stripped; HTML emission and manifest read pass-2's metafile
- [ ] 1.3 `pnpm -F esbuild-plugin-html-split type-check` green

## 2. App

- [ ] 2.1 `config.mts`: restore `minify: isProd`, enable `twoPassCss` for prod, drop the stable-names comment
- [ ] 2.2 `pnpm -F @loom-js/loom type-check` green

## 3. Verification (fresh prod builds)

- [ ] 3.1 Name-consistency assert: a css-module selector from the docs stylesheet appears verbatim in the docs JS chunk; no `stem_name`-form classes in output
- [ ] 3.2 Route-scoped-css audits repeat green: entry shared-only, route bundles owned-only, nothing duplicated, manifest + shells correct
- [ ] 3.3 Runtime: hard load + SPA nav styled with no FOUC; prerendered pages' class names match the shipped stylesheets
- [ ] 3.4 Size: gzip JS total back to ~43.8 KB (the +4.2 KB reclaimed); build-time delta recorded
