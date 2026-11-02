// The loom mark: one seven-circle geometry and the theme colors it paints
// with. Every brand file (SVGs, favicons, manifest, social images) and the
// shells' icon/OG tags derive from this module.

/** `light` and `dark` paint the disc in theme ink; `mono` is one `currentColor` ink. */
export type MarkVariant = 'dark' | 'light' | 'mono';

interface Circle {
    cx: number;
    cy: number;
    r: number;
}

interface Ring {
    /** The crescent's color disc. */
    color: Circle;
    fill: string;
    /** The ink disc cut into it, drifting down-left. */
    ink: Circle;
}

/** The mark's square viewBox edge, in SVG units. */
export const MARK_SIZE = 114.92;

/** The outer disc the rings are cut into. */
export const MARK_DISC: Circle = { cx: 57.46, cy: 57.46, r: 57.46 };

/** The three crescents, outer to inner. */
export const MARK_RINGS: Ring[] = [
    {
        color: { cx: 57.46, cy: 57.46, r: 44.5 },
        // brand-3, the site's --brand-light: hsl(15 87% 55%)
        fill: '#F05A28',
        ink: { cx: 47.6, cy: 67.33, r: 41.5 }
    },
    {
        color: { cx: 47.6, cy: 67.33, r: 30.5 },
        // brand-2: hsl(325 100% 50%)
        fill: '#FF0095',
        ink: { cx: 40.6, cy: 74.33, r: 27.5 }
    },
    {
        color: { cx: 39.5, cy: 75.5, r: 18.5 },
        // brand-4's hue lifted for the dark disc: hsl(301 50% 55%)
        fill: '#C653C4',
        ink: { cx: 35.5, cy: 79.5, r: 14.5 }
    }
];

/** Disc and core color per variant. */
export const MARK_INK = {
    // --text1-light: hsl(15 87% 10%)
    light: '#300E03',
    // --surface3-dark: hsl(15 5% 20%)
    dark: '#363230'
} as const;

/** --surface1-dark: hsl(15 10% 10%), the ground for opaque icons and previews. */
export const SURFACE_DARK = '#1C1817';

/** The name shells, the manifest and link previews show. */
export const SITE_NAME = 'loomjs';
/** The description link previews and the manifest show. */
export const SITE_DESCRIPTION =
    'A reactive, component-driven, JavaScript framework.';

/** Where the icon files are served. */
export const FAVICON_DIR = '/static/favicon';
/** Where the web manifest is served. */
export const MANIFEST_PATH = '/static/site.webmanifest';
/** The link-preview image: where it is served and its pixel size. */
export const OG_IMAGE = {
    height: 630,
    path: '/static/img/og-image.png',
    width: 1200
};

const circle = ({ cx, cy, r }: Circle, attributes: string) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" ${attributes}/>`;

const svg = (body: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_SIZE} ${MARK_SIZE}">${body}</svg>\n`;

// Ink painted over color reproduces the cut-outs: every ink disc lies inside
// the outer disc, so no clipping is needed.
const paintedMark = (inkAttributes: string) =>
    circle(MARK_DISC, inkAttributes) +
    MARK_RINGS.map(
        ({ color, fill, ink }) =>
            circle(color, `fill="${fill}"`) + circle(ink, inkAttributes)
    ).join('');

/** The mark as a standalone SVG document. */
export const markSvg = (variant: MarkVariant) => {
    if (variant !== 'mono') {
        return svg(paintedMark(`fill="${MARK_INK[variant]}"`));
    }

    // One ink, with the crescents cut out so any background shows through.
    const holes = MARK_RINGS.map(
        ({ color, ink }) =>
            circle(color, 'fill="black"') + circle(ink, 'fill="white"')
    ).join('');

    return svg(
        `<mask id="cut">${circle(MARK_DISC, 'fill="white"')}${holes}</mask>` +
            circle(MARK_DISC, 'fill="currentColor" mask="url(#cut)"')
    );
};

/** The light mark, swapping its ink to the dark variant with the OS scheme. */
export const faviconSvg = () =>
    svg(
        `<style>.ink{fill:${MARK_INK.light}}@media (prefers-color-scheme:dark){.ink{fill:${MARK_INK.dark}}}</style>` +
            paintedMark('class="ink"')
    );

const escapeAttribute = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/** Icon, manifest and social-preview tags for a shell's `<head>`. */
export const brandHead = ({
    origin,
    title
}: {
    origin: string;
    title: string;
}) =>
    [
        `<link href="${FAVICON_DIR}/favicon.ico" rel="icon" sizes="32x32" />`,
        `<link href="${FAVICON_DIR}/favicon.svg" rel="icon" type="image/svg+xml" />`,
        `<link href="${FAVICON_DIR}/apple-touch-icon.png" rel="apple-touch-icon" />`,
        `<link href="${MANIFEST_PATH}" rel="manifest" />`,
        `<meta content="${SURFACE_DARK}" name="theme-color" />`,
        `<meta content="website" property="og:type" />`,
        `<meta content="${SITE_NAME}" property="og:site_name" />`,
        `<meta content="${escapeAttribute(title)}" property="og:title" />`,
        `<meta content="${SITE_DESCRIPTION}" property="og:description" />`,
        `<meta content="${origin}${OG_IMAGE.path}" property="og:image" />`,
        `<meta content="${OG_IMAGE.width}" property="og:image:width" />`,
        `<meta content="${OG_IMAGE.height}" property="og:image:height" />`,
        `<meta content="The loom mark" property="og:image:alt" />`,
        `<meta content="summary_large_image" name="twitter:card" />`
    ]
        .map((tag) => `    ${tag}`)
        .join('\n');

/** The web app manifest served at `MANIFEST_PATH`. */
export const webManifest = () =>
    `${JSON.stringify(
        {
            name: SITE_NAME,
            short_name: 'loom',
            description: SITE_DESCRIPTION,
            start_url: '/',
            display: 'standalone',
            theme_color: SURFACE_DARK,
            background_color: SURFACE_DARK,
            icons: [
                ['android-chrome-192x192.png', 192, 'any'],
                ['android-chrome-512x512.png', 512, 'any'],
                ['android-chrome-maskable-512x512.png', 512, 'maskable']
            ].map(([file, size, purpose]) => ({
                src: `${FAVICON_DIR}/${file}`,
                sizes: `${size}x${size}`,
                type: 'image/png',
                purpose
            }))
        },
        null,
        4
    )}\n`;

interface RasterAsset {
    /** Path from the loom app's root. */
    path: string;
    width: number;
    height: number;
    variant: Exclude<MarkVariant, 'mono'>;
    /** Opaque ground, or transparent when absent. */
    ground?: string;
    /** The mark's diameter as a share of the shorter edge. */
    scale: number;
}

const FAVICON_FILES = 'public/static/favicon';

/** Every PNG the generator renders from the mark. */
export const RASTER_ASSETS: RasterAsset[] = [
    ...[16, 32].map((size) => ({
        path: `${FAVICON_FILES}/favicon-${size}x${size}.png`,
        width: size,
        height: size,
        variant: 'light' as const,
        scale: 1
    })),
    // iOS fills transparency with black, so the touch icon carries a ground.
    {
        path: `${FAVICON_FILES}/apple-touch-icon.png`,
        width: 180,
        height: 180,
        variant: 'dark',
        ground: SURFACE_DARK,
        scale: 0.8
    },
    ...[192, 512].map((size) => ({
        path: `${FAVICON_FILES}/android-chrome-${size}x${size}.png`,
        width: size,
        height: size,
        variant: 'light' as const,
        scale: 1
    })),
    // Inside the maskable safe zone: the centered circle of 80% diameter.
    {
        path: `${FAVICON_FILES}/android-chrome-maskable-512x512.png`,
        width: 512,
        height: 512,
        variant: 'dark',
        ground: SURFACE_DARK,
        scale: 0.76
    },
    {
        path: 'public/static/img/loom-logo.png',
        width: 480,
        height: 480,
        variant: 'light',
        scale: 1
    },
    {
        path: `public${OG_IMAGE.path}`,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        variant: 'dark',
        ground: SURFACE_DARK,
        scale: 0.6
    },
    {
        path: '../../.github/social-preview.png',
        width: 1280,
        height: 640,
        variant: 'dark',
        ground: SURFACE_DARK,
        scale: 0.6
    },
    {
        path: '../../packages/core/assets/img/loom-logo.png',
        width: 280,
        height: 280,
        variant: 'light',
        scale: 1
    }
];

/** The frames packed into `favicon.ico`. */
export const ICO_SIZES = [16, 32, 48];

/** Every text file the generator writes, keyed by path from the app root. */
export const TEXT_ASSETS: Record<string, () => string> = {
    'public/static/svg/loom-logo.svg': () => markSvg('dark'),
    'public/static/svg/loom-logo-light.svg': () => markSvg('light'),
    'public/static/svg/loom-logo-mono.svg': () => markSvg('mono'),
    [`${FAVICON_FILES}/favicon.svg`]: faviconSvg,
    [`public${MANIFEST_PATH}`]: webManifest
};
