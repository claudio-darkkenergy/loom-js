# Loom Logo

## Why

The current mark (`apps/loom/public/static/svg/loom-logo.svg`) is a 16-hairline spirograph with 0.93-unit strokes: it dissolves below 48 px, so it can't serve as a favicon or app icon. The site also ships no icon wiring at all: favicon PNGs sit in `public/static/favicon/`, but no shell links them, no web manifest exists, and shared links render without a preview image. The maintainer settled on a replacement mark on 2026-11-01. It's concept Ic, three crescents and an ink core, purple/pink/orange, explored on the Loom Logo Concepts canvas. It holds from 16 px up, so this change can adopt it everywhere the brand appears in one pass.

## What Changes

- **New mark**: a dark disc holding three nested crescents that thin inward (orange → magenta → purple) around an ink core, each ring drifting down-left. Its geometry is exactly the maintainer's Figma frame "circle looms – eclipse & 3 cresents / purple/pink/orange": seven circles, no paths. One geometry carries every size from 16 px up; there is no separate favicon cut.
- **Colors come from loom's theme**:
    - Outer crescent: brand-3 / `--brand-light` (`#F05A28`).
    - Middle crescent: brand-2 (`#FF0095`).
    - Inner crescent: brand-4's hue lifted to `hsl(301 50% 55%)` (`#C653C4`).
    - Disc: `--text1-light` (`#300E03`) on light and `--surface3-dark` (`#363230`) on dark.
- **Master SVGs replace the old mark under its name**: `loom-logo.svg` is now the dark variant, the one the app renders, and it's joined by `loom-logo-light.svg` and `loom-logo-mono.svg`. The mono variant has see-through cut-outs and `currentColor` ink.
- **Icon set**:
    - Adaptive `favicon.svg` that swaps the disc under `prefers-color-scheme: dark`.
    - `favicon.ico` with 16/32/48 fallbacks.
    - 180 px `apple-touch-icon.png`.
    - 192/512 Android icons plus a 512 maskable icon.
    - `site.webmanifest`.
    - The PNG favicons already in `public/static/favicon/` are regenerated in place.
- **Shell head wiring** in `apps/loom/loom.config.ts` `html.head`:
    - Icon links, manifest link and `theme-color`.
    - Open Graph and Twitter card meta, with an absolute 1200×630 `og:image`.
- **Brand logo in the app**: `BrandLogo` (the header link) keeps its `/static/svg/loom-logo.svg` src, which now holds the dark variant. The app renders dark-only (`bodyClass: 'theme-dark'`).
- **Elsewhere**:
    - The README logo at `packages/core/assets/img/loom-logo.png` is regenerated in place, so the README markup and the npm page are unchanged.
    - A 1280×640 social preview image is produced for the GitHub repo settings.
- **Reproducible generator**: a committed script regenerates every derived file from the one geometry.
- The old spirograph files are replaced in place, not kept. `svg/loom-logo.svg`, `img/loom-logo.png`, the favicon PNGs and the README PNG all keep their names and get the new mark (maintainer direction, 2026-11-01).

## Capabilities

### New Capabilities

- `app-brand-identity`: the loom mark and its variants, the icon and manifest set every shell declares, the social-preview metadata, and the in-app brand logo, all derived from one geometry and loom's theme tokens.

### Modified Capabilities

_None._ `build-tool-config` already lets an app inject arbitrary `<head>` markup (`html.head`), and the favicon wiring lives in the app's config, so the build tool gains no icon feature. `app-asset-delivery` governs JS/CSS/fonts/the LCP image; icons are linked, not preloaded, so none of its requirements change.

## Impact

- `apps/loom/public/static/` gets `svg/loom-logo.svg` (rewritten) plus new `svg/loom-logo-light.svg`, `svg/loom-logo-mono.svg`, `favicon/favicon.svg`, `favicon/favicon.ico`, `favicon/android-chrome-maskable-512x512.png`, `site.webmanifest` and `img/og-image.png`. `img/loom-logo.png` and the existing favicon PNGs are regenerated.
- `apps/loom/loom.config.ts`: `html.head` gains the icon, manifest, theme-color and social meta tags (with `SITE_ORIGIN` for absolute URLs).
- `apps/loom/scripts/` gets a new brand-asset generator (puppeteer renders plus an ICO packer, with no new dependencies). It's run by hand, not by turbo.
- `apps/loom/project/client/tests/` gets a node test asserting the shells' head wiring and the manifest's icon entries.
- `packages/core/assets/img/loom-logo.png` is regenerated. The README text is unchanged.
- GitHub: the maintainer uploads the 1280×640 social preview in repo settings (manual).
- No published package API changes. A `@loom-js/core` patch changeset is only needed if the README image change should reach npm; the image is fetched from GitHub, so it isn't.
