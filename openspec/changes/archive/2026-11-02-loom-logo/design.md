# Design

## Context

- The mark was explored on the Loom Logo Concepts canvas (concepts A–Ic) and settled in the maintainer's Figma frame "circle looms – eclipse & 3 cresents / purple/pink/orange". Figma exports it as filled circles plus one boolean "Union" path for the ink.
- `@loom-js/build` copies `publicDir` (`apps/loom/public/static`) to `/static/`. It also offers `copy` for extra files and `html.head(args)` for arbitrary `<head>` markup. Nothing in the template emits icons today.
- The app renders dark-only: the shell's `bodyClass` is `'theme-dark'`, and nothing in `src` toggles it.
- `apps/loom/project/client/*.mts` holds build-time modules that `loom.config.ts` imports. Their node tests live in `project/client/tests/` (`test-ci`).
- `apps/loom` has no puppeteer. `packages/core` and `apps/bench` do.
- The space has a `site` content type with a `logo` field, but no `site` entry, and `getSite` has no caller. Contentful holds no logo to replace.

## Goals / Non-Goals

**Goals:**

- One source of truth for the mark. Every SVG, PNG and ICO derives from it, with no hand-edited copies.
- Icon and social wiring that's correct on the first deploy, checked by tests that don't need a full Contentful build.

**Non-Goals:**

- A wordmark or lockup. The header keeps its text "loom" beside the mark.
- Light-theme UI: the app is dark-only, and the light mark ships for README, light contexts and the favicon's light scheme.
- Build-tool icon features: `html.head` already covers this, and it's an app concern.
- Animated marks and print formats.

## Decisions

**1. Masters are painted circles, not boolean paths.** Each variant is the disc, then colour disc → ink disc → colour disc… stacked in paint order: seven `<circle>` elements, about 500 bytes. Every ink disc lies inside the outer disc, so painting ink over colour gives exactly the Figma union's silhouette.

- Rejected: exporting Figma's `Union` path. It's larger, its arcs are opaque Béziers, and a one-unit tweak means redrawing it in Figma.
- The mono variant is the exception. It needs see-through cut-outs, so it uses one `<mask>` (disc white, colour discs black, ink discs white) on a single `currentColor` disc.

**2. One geometry module drives everything.** `apps/loom/project/client/brand.mts` exports:

- the circle list and palette;
- `markSvg(variant)` and `faviconSvg()`;
- `brandHead(origin)`, the `<head>` markup;
- `webManifest()`.

`loom.config.ts` imports `brandHead` into `html.head`. A generator script, `apps/loom/scripts/brand-assets.mts`, imports the same module and writes every file. Tests import it too. Changing a radius or color is one edit plus `pnpm -F @loom-js/loom brand-assets`.

- Rejected: committing hand-exported files from Figma. They drift, and the README PNG and OG image would each need their own manual export.

**3. Dark variant disc is `--surface3-dark` (`#363230`).** It's one step lighter than the page surface `#1C1817`, so the disc's edge and the ink core still read, and the crescents gain contrast. The options compared on the canvas:

- Rejected: `--text1-dark` (`#DED6D3`) disc. It inverts the mark and reads as a different logo.
- Rejected: no disc. The ink core vanishes, so it stops being an eclipse.
- Rejected: `#300E03` on dark. It works, but the disc's edge barely separates from the page.

**4. Purple stays a literal, not a token.** `#C653C4` is brand-4's hue at `hsl(301 50% 55%)`, and only the mark uses it. Adding a CSS custom property nothing reads would be dead code. The module documents it as derived from brand-4, next to the token-backed colors.

**5. Adaptive SVG favicon via an internal `<style>`.** `favicon.svg` is the light variant. Its disc and core carry `class="ink"`, and `@media (prefers-color-scheme: dark) { .ink { fill: #363230 } }` swaps them. This follows the browser/OS scheme, which is what tab chrome uses, not the app theme. `favicon.ico` (PNG-in-ICO, 16/32/48) covers browsers without SVG favicon support.

**6. Head wiring lives in the app config.** `brandHead(SITE_ORIGIN)` returns:

- the icon, apple-touch and manifest links;
- `theme-color`;
- `og:*` and `twitter:*` meta.

`og:title` reuses the shell's title function. `og:description` is a fixed string in the module. Contentful's `seoDescription` isn't available when `html.head` runs, and the site description rarely changes. `/favicon.ico` at the root comes from a `copy` entry (`favicon/favicon.ico` → `.`). Vercel serves files before rewrites, so the SPA fallback doesn't shadow it.

**7. Generator renders with puppeteer and packs ICO by hand.**

- PNGs: each one is a page screenshot of the SVG at its pixel size with a transparent background. The exceptions are the touch, maskable, OG and social images, which get the `#1C1817` ground: iOS fills transparency with black, and maskable icons must be opaque.
- ICO: the header and directory are about 20 lines of `Buffer` writes around the 16/32/48 PNGs.
- `puppeteer` becomes an `apps/loom` devDependency, pinned to core's version.
- Rejected: `sharp`, `resvg` and `png-to-ico`. They're extra native or binary dependencies for a script run a few times a year.

**8. Asset placement.**

- `public/static/svg/loom-logo.svg` (dark, the in-app variant), `loom-logo-light.svg` and `loom-logo-mono.svg`.
- `public/static/favicon/` holds the existing PNG names (regenerated), plus `favicon.svg` and `android-chrome-maskable-512x512.png`.
- `public/static/site.webmanifest`.
- `public/static/img/og-image.png`.
- `.github/social-preview.png`, which is uploaded by hand and never deployed.
- `public/static/img/loom-logo.png`, regenerated at its existing 480 px.
- `packages/core/assets/img/loom-logo.png`, regenerated at 280 px (2× the README's 140).

Each old spirograph file is overwritten under its own name, by maintainer direction, so `BrandLogo`, the README and any external link keep resolving with no path changes.

**9. OG image is mark-only.** The mark is centered on `#1C1817` at 1200×630, and the 1280×640 social preview is built the same way. The site font, Pelinka, is MyFonts-licensed, and baking it into a raster asset is outside a webfont license's usual terms. So no text is rendered into the image, and the page title already travels in `og:title`.

**10. Tests run off the module, not a build.** `project/client/tests/brand.test.mjs` covers:

- Geometry and palette match the spec.
- Each committed SVG equals the module's output, which catches hand edits and drift.
- `brandHead` contains every required tag, with an absolute `og:image`.
- Every manifest icon file exists with its declared size, read from the PNG IHDR bytes.
- Exactly one manifest icon is maskable.

## Risks / Trade-offs

- **[Safari SVG favicon support is uneven]** → The ICO and touch icon cover it. The ICO link carries `sizes="32x32"` and the SVG link follows it, so SVG-capable browsers pick the SVG.
- **[The purple crescent is about 1.3 px thick at 16 px]** → The maintainer accepted one geometry for all sizes. The 16 px ICO frame is inspected by eye during apply. If it smudges, that's a design call, not a silent fallback.
- **[The RSS icon has similar shape language: lower-left anchor, arcs to the upper right]** → It's accepted. Nested crescents in a disc separate it, and the lookalike scan of 3,296 Simple Icons brands found no match. A reverse-image and WIPO check is a maintainer task before launch.
- **[Puppeteer renders differ slightly across Chrome versions]** → Committed PNGs are the artifact, and the test compares the SVGs only, not raster bytes.

## Migration Plan

1. Land the module, generator, assets, config wiring and tests in one change. No consumer API moves.
2. Deploy. Then check one shared docs link in a preview debugger and the installed-app icon on Android or iOS.
3. Upload `.github/social-preview.png` in the GitHub repo settings (manual).
4. Rollback: revert the commit, which restores the old files under the same names.

## Open Questions

- Wordmark: a typeset "loom" lockup for the README and OG image is deferred to its own change once a license-clear typeface is picked. Nothing here blocks on it.
