# Spec Delta

## Purpose

Defines the loom brand mark and every place `@loom-js/loom` presents it: the mark's geometry and theme colors, the icon and manifest set each shell declares, social-preview metadata, and the in-app brand logo. All of it derives from one geometry, so the brand reads the same from a 16 px tab icon to a link preview.

## ADDED Requirements

### Requirement: The mark is one fixed geometry

The loom mark SHALL be drawn from seven circles on a 114.92-unit square: a disc of radius 57.46 at the center, then three crescents and an ink core. Each crescent is a colour disc with an ink disc cut into it, and each step drifts down-left. Every size, from 16 px up, SHALL render this one geometry. No simplified small-size cut SHALL exist.

#### Scenario: Geometry matches the adopted design

- **WHEN** a master SVG's circles are read
- **THEN** the colour discs are r 44.5 at (57.46, 57.46), r 30.5 at (47.6, 67.33) and r 18.5 at (39.5, 75.5)
- **AND** the ink discs are r 41.5 at (47.6, 67.33), r 27.5 at (40.6, 74.33) and r 14.5 at (35.5, 79.5), painted in that alternating order over the disc

#### Scenario: Small sizes use the same drawing

- **WHEN** the 16, 32 and 48 px favicon images are produced
- **THEN** each is rendered from the same geometry as the 512 px icon

### Requirement: The mark's colors come from loom's theme

The crescents SHALL be, from outer to inner: brand-3 (`#F05A28`, the site's `--brand-light`), brand-2 (`#FF0095`) and brand-4's hue lifted to `hsl(301 50% 55%)` (`#C653C4`). The disc and core SHALL be `--text1-light` (`#300E03`) in the light variant and `--surface3-dark` (`#363230`) in the dark variant.

#### Scenario: Light variant

- **WHEN** `loom-logo-light.svg` is rendered
- **THEN** the disc and core are `#300E03` and the crescents are `#F05A28`, `#FF0095` and `#C653C4`, outer to inner

#### Scenario: Dark variant

- **WHEN** `loom-logo.svg` (the dark variant) is rendered on the dark surface (`#1C1817`)
- **THEN** the disc and core are `#363230`, the crescents keep their light-variant colors, and the disc's edge stays visible against the page

### Requirement: A one-ink variant exists

A mono variant SHALL draw the disc and core in `currentColor`. Its crescents and gaps SHALL be transparent cut-outs, not painted with a background color, so the mark works on any background in a single ink.

#### Scenario: Mono on an arbitrary background

- **WHEN** `loom-logo-mono.svg` is placed on any background
- **THEN** the background shows through the crescents, and the ink takes the surrounding text color

### Requirement: Every shell declares the icon set

Every HTML shell the loom app emits SHALL link these:

- an SVG favicon (`type="image/svg+xml"`)
- an ICO fallback
- a 180 px Apple touch icon
- the web manifest
- a `theme-color` meta equal to the dark surface (`#1C1817`)

#### Scenario: Shell head carries the links

- **WHEN** the production build writes the `/`, `/benchmarks` and `/docs` shells
- **THEN** each `<head>` contains `rel="icon"` links to `/static/favicon/favicon.svg` and `/static/favicon/favicon.ico`, `rel="apple-touch-icon"` to `/static/favicon/apple-touch-icon.png`, `rel="manifest"` to `/static/site.webmanifest`, and `<meta name="theme-color" content="#1C1817">`

#### Scenario: Root favicon request

- **WHEN** a client requests `/favicon.ico` without reading the shell
- **THEN** the deployment serves the mark's ICO file rather than the SPA shell

### Requirement: The SVG favicon follows the browser's color scheme

The SVG favicon SHALL draw the light variant by default and SHALL switch the disc and core to the dark-variant color under `prefers-color-scheme: dark`, all within the one file.

#### Scenario: Dark browser chrome

- **WHEN** the browser or OS prefers a dark color scheme
- **THEN** the tab icon's disc renders `#363230`, and it renders `#300E03` otherwise

### Requirement: The web manifest describes the installed app

`/static/site.webmanifest` SHALL name the app, set `theme_color` and `background_color` to the dark surface, and list 192 px and 512 px PNG icons with purpose `any`. It SHALL also list a 512 px icon with purpose `maskable` whose mark sits inside the maskable safe zone, the centered circle of 80 % diameter.

#### Scenario: Manifest icons resolve

- **WHEN** the manifest's `icons` entries are fetched from the built output
- **THEN** each file exists with the declared pixel size, and exactly one entry declares `purpose: "maskable"`

#### Scenario: Maskable crop keeps the mark whole

- **WHEN** the maskable icon is clipped to its centered 80 % circle
- **THEN** no part of the disc is cut off

### Requirement: Shells carry social preview metadata

Every shell SHALL carry `og:title` (matching the shell's `<title>`), `og:description`, `og:image`, `og:image:width`/`og:image:height`, and `twitter:card` set to `summary_large_image`. The `og:image` SHALL be an absolute URL on the site origin pointing at a 1200×630 PNG that shows the mark.

#### Scenario: Link preview

- **WHEN** a docs URL is shared to a service that reads Open Graph tags
- **THEN** the preview uses the 1200×630 mark image from an absolute `https://` URL and the page's own title

### Requirement: The app's brand logo is the mark

The brand logo in the loom app header SHALL render the mark in the variant that matches the app's rendered theme. The app renders dark-only, so the header uses the dark variant, `loom-logo.svg`.

#### Scenario: Header logo

- **WHEN** any route renders the header brand link
- **THEN** its image source is `/static/svg/loom-logo.svg`, and that file is the dark variant

### Requirement: Derived assets regenerate from the geometry

Every raster and ICO brand asset SHALL be produced by one committed generator from the mark's geometry and palette, so changing either is a single edit followed by one regeneration. The assets are: the favicon PNGs, the ICO, the touch and Android icons, the maskable icon, the Open Graph image, the GitHub social preview and the README PNG.

#### Scenario: Regeneration is reproducible

- **WHEN** the generator runs against an unchanged geometry and palette
- **THEN** it rewrites every derived asset at its declared path and pixel size, and the committed files are left without visual change
