# Tasks

## 1. Mark module (loom app)

- [x] 1.1 Add `apps/loom/project/client/brand.mts` with:
    - the seven-circle geometry and palette, each color commented with its token (purple noted as derived from brand-4);
    - `markSvg('light' | 'dark' | 'mono')`, where mono uses one `<mask>` and `currentColor`;
    - `faviconSvg()`: the light variant with `class="ink"` and a `prefers-color-scheme: dark` style.
- [x] 1.2 Add `brandHead(origin)` and `webManifest()` to the module:
    - icon/ICO/apple-touch/manifest links;
    - `theme-color` `#1C1817`;
    - `og:*` and `twitter:card`, with an absolute 1200×630 `og:image`;
    - manifest `theme_color`/`background_color` `#1C1817`, 192/512 `any` icons and a 512 `maskable` icon.
- [x] 1.3 Add `project/client/tests/brand.test.mjs` covering:
    - geometry and colors match the spec's numbers;
    - `brandHead` carries every required tag, with `og:image` starting `https://`;
    - the manifest has exactly one maskable icon.

    Verify: `pnpm -F @loom-js/loom test-ci` passes.

## 2. Generator and assets (loom app)

- [x] 2.1 Add `puppeteer` to `apps/loom` devDependencies at `packages/core`'s version, plus a `brand-assets` script (`node scripts/brand-assets.mts`). Update `.claude/skills/skill-config.md` for the new dependency and the `scripts/` folder. Verify: `pnpm install` succeeds.
- [x] 2.2 Add `apps/loom/scripts/brand-assets.mts`. It imports `brand.mts` and writes:
    - `svg/loom-logo.svg` (dark), `svg/loom-logo-light.svg`, `svg/loom-logo-mono.svg`, `favicon/favicon.svg` and `site.webmanifest`;
    - the favicon PNGs (16, 32, 180 touch, 192, 512), on a transparent background except the touch icon on `#1C1817`;
    - the maskable 512, with the mark inside the 80 % safe circle on `#1C1817`;
    - `favicon.ico` (PNG-in-ICO, 16/32/48, packed by hand);
    - `img/og-image.png` (1200×630) and `.github/social-preview.png` (1280×640), both mark-only on `#1C1817`;
    - `img/loom-logo.png` at 480 px and `packages/core/assets/img/loom-logo.png` at 280 px, each overwriting the old file.
- [x] 2.3 Run `pnpm -F @loom-js/loom brand-assets`. Check by eye: the 16/32/48 ICO frames, the maskable crop at 80 %, and the OG image. Verify: every file exists at its declared pixel size.
- [x] 2.4 Extend `brand.test.mjs`:
    - each committed SVG is byte-equal to the module's output;
    - each manifest icon file exists with its declared size, read from the PNG IHDR;
    - `favicon.ico` lists 16/32/48 entries.

    Verify: `pnpm -F @loom-js/loom test-ci` passes.

## 3. Wiring (loom app)

- [x] 3.1 In `apps/loom/loom.config.ts`:
    - add `brandHead(SITE_ORIGIN)` to `html.head`, next to the dns-prefetch;
    - make `og:title` follow the existing `title(scope)`;
    - add a `copy` entry from `favicon/favicon.ico` to the output root.

    Verify: `pnpm -F @loom-js/loom type-check` passes.

- [x] 3.2 Confirm `BrandLogo` (`src/app/components/branding/logo/BrandLogo.ts`) still points at `/static/svg/loom-logo.svg`, which now holds the dark variant; no code change. Verify: `pnpm -F @loom-js/loom dev` shows the new mark in the header at 36 px.
- [x] 3.3 Run an isolated prod build (`LOOM_BUILD_DIR=… pnpm -F @loom-js/loom build`). Check:
    - each of the `/`, `/benchmarks` and `/docs` shells has the icon, manifest, theme-color and OG tags;
    - `/favicon.ico` sits at the output root;
    - `/static/site.webmanifest` and all of its icons are present;
    - the tab icon swaps disc color when the OS theme toggles.

## 4. External surfaces

- [ ] 4.1 Hand off `.github/social-preview.png` to the maintainer for GitHub → Settings → Social preview. Also hand off the reverse-image and WIPO Global Brand Database check on `og-image.png` before launch. Verify: the maintainer confirms both.
- [x] 4.2 Run `pnpm format:check`. Review the diff in the IDE before committing; the app is private, so it gets no changeset. Verify: the format check is clean and the maintainer has reviewed the diff.

## 5. Post-deploy

- [ ] 5.1 After deploy, check a shared docs URL in an Open Graph preview debugger and the installed-app icon on one mobile platform. Verify: the preview shows the 1200×630 image and the page title, and the icon is uncropped.
