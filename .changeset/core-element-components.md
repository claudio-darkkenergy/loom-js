---
'@loom-js/core': minor
---

Core gains its kit-agnostic element components — the element-level survivors of the upcoming `@loom-js/tags` retirement, all tree-shakeable named exports:

- **`RouteLink`** — an anchor wired to the SPA router: same-origin activations route via `route()` with no caller-supplied handler; `target="_blank"` and cross-origin hrefs fall through to the browser default.
- **`Svg`** — sprite composition (`path` + `svgId` → `<use href="path#id">`, `fill="currentColor"`, `size`/`height`/`width`).
- **`Picture`** — responsive image with the chooser built in: a `sources` array renders `<picture>` + `<source>`s + `<img>`; no sources renders the bare `<img>`. `SourceProps` exported as a type.
- **`el(tagName)`** — a plain HTML tag as a memoized component value, for `is=` polymorphism, third-party render callbacks, and props transformers (`is=${el('footer')}`, `el('h2')({ children })`). Void tags render childless.

Also fixes tree-shaking for these additions: top-level `component()` definitions now carry `/* @__PURE__ */` annotations, preserved through the build (`removeComments` dropped from the package tsconfig; terser configured with `preserve_annotations`), so bundlers drop unused element components entirely.
