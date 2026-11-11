# Tasks

## 1. Failing checks

- [ ] 1.1 Add a puppeteer check under `packages/core/tests/` that renders an SVG template binding `x`, `width`, `d` and `viewBox` three times and collects the page's console messages; confirm it reports the attribute errors on the current code.
- [ ] 1.2 Add plan specs: a clone carries no dynamic attribute; `viewBox` is applied under its authored case; text ending in `=` stays text; confirm the first two fail with `pnpm -F @loom-js/core test-ci`.

## 2. Markers and stripping

- [ ] 2.1 Add the chunk-tail attribute-name helper with unit specs for quoted, unquoted, `$`-prefixed and namespaced names (D3).
- [ ] 2.2 Write attribute slots as marker attributes when joining statics, on both the contextual-fragment and template-element paths; the plan reads authored names by ordinal and strips every dynamic attribute (D1, D2); 1.1 and 1.2 pass.
- [ ] 2.3 Drop the style updater's guard against a surviving placeholder if no spec needs it; the attr-value-semantics specs pass.
- [ ] 2.4 Run the full core suite, `type-check`, `type-check-tests`, the server-rendering and hydration specs, the build tool's prerender tests, and `pnpm bench`; all pass with no regression beyond noise.

## 3. Release notes

- [ ] 3.1 Rebuild the devtools frontend and open the HUD on the docs app; the console shows no SVG attribute errors.
- [ ] 3.2 Add a core patch changeset; file-audit `SOLID-AUDIT-REPORT.md` for the touched files and map any new module to its spec.
