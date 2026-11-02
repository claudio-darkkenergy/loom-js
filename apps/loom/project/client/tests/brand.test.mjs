import { describe, it } from 'node:test';

import {
    brandHead,
    ICO_SIZES,
    MARK_DISC,
    MARK_INK,
    MARK_RINGS,
    markSvg,
    RASTER_ASSETS,
    TEXT_ASSETS,
    webManifest
} from '../brand.mts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(import.meta.dirname, '../../..');
const readAsset = (relativePath) =>
    readFileSync(path.resolve(APP_ROOT, relativePath));

// Width and height from a PNG's IHDR chunk.
const pngSize = (buffer) => {
    assert.equal(buffer.subarray(1, 4).toString(), 'PNG');

    return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
};

describe('brand mark', () => {
    it('keeps the adopted geometry', () => {
        assert.deepEqual(MARK_DISC, { cx: 57.46, cy: 57.46, r: 57.46 });
        assert.deepEqual(
            MARK_RINGS.map(({ color, ink }) => [color, ink]),
            [
                [
                    { cx: 57.46, cy: 57.46, r: 44.5 },
                    { cx: 47.6, cy: 67.33, r: 41.5 }
                ],
                [
                    { cx: 47.6, cy: 67.33, r: 30.5 },
                    { cx: 40.6, cy: 74.33, r: 27.5 }
                ],
                [
                    { cx: 39.5, cy: 75.5, r: 18.5 },
                    { cx: 35.5, cy: 79.5, r: 14.5 }
                ]
            ]
        );
    });

    it('paints the theme colors, outer to inner', () => {
        assert.deepEqual(
            MARK_RINGS.map(({ fill }) => fill),
            ['#F05A28', '#FF0095', '#C653C4']
        );
        assert.deepEqual(MARK_INK, { light: '#300E03', dark: '#363230' });
    });

    it('paints ink over color in alternating order', () => {
        const fills = [...markSvg('light').matchAll(/fill="([^"]+)"/g)].map(
            ([, fill]) => fill
        );

        assert.deepEqual(fills, [
            '#300E03',
            '#F05A28',
            '#300E03',
            '#FF0095',
            '#300E03',
            '#C653C4',
            '#300E03'
        ]);
    });

    it('draws the mono variant in currentColor with see-through cut-outs', () => {
        const mono = markSvg('mono');

        assert.match(mono, /fill="currentColor" mask="url\(#cut\)"/);
        assert.doesNotMatch(mono, /#[0-9A-F]{6}/i);
    });
});

describe('brand head', () => {
    const head = brandHead({
        origin: 'https://site.test',
        title: 'Docs | Loomjs'
    });

    it('links the icon set and manifest', () => {
        [
            '<link href="/static/favicon/favicon.ico" rel="icon" sizes="32x32" />',
            '<link href="/static/favicon/favicon.svg" rel="icon" type="image/svg+xml" />',
            '<link href="/static/favicon/apple-touch-icon.png" rel="apple-touch-icon" />',
            '<link href="/static/site.webmanifest" rel="manifest" />',
            '<meta content="#1C1817" name="theme-color" />'
        ].forEach((tag) => assert.ok(head.includes(tag), tag));
    });

    it('carries the description and social preview with an absolute image', () => {
        [
            '<meta content="Docs | Loomjs" property="og:title" />',
            '<meta content="https://site.test/static/img/og-image.png" property="og:image" />',
            '<meta content="1200" property="og:image:width" />',
            '<meta content="630" property="og:image:height" />',
            '<meta content="summary_large_image" name="twitter:card" />'
        ].forEach((tag) => assert.ok(head.includes(tag), tag));
        assert.match(head, /property="og:description"/);
        assert.match(head, /name="description"/);
    });
});

describe('web manifest', () => {
    const manifest = JSON.parse(webManifest());

    it('opens home-screen launches in the browser', () => {
        assert.equal(manifest.display, 'browser');
    });

    it('sets the dark surface as theme and background', () => {
        assert.equal(manifest.theme_color, '#1C1817');
        assert.equal(manifest.background_color, '#1C1817');
    });

    it('lists 192/512 icons and exactly one maskable icon', () => {
        assert.deepEqual(
            manifest.icons.map(({ sizes, purpose }) => `${sizes} ${purpose}`),
            ['192x192 any', '512x512 any', '512x512 maskable']
        );
    });
});

describe('committed brand files', () => {
    it('match the module output (regenerate with `pnpm brand-assets`)', () => {
        Object.entries(TEXT_ASSETS).forEach(([relativePath, contents]) =>
            assert.equal(
                readAsset(relativePath).toString(),
                contents(),
                relativePath
            )
        );
    });

    it('render every PNG at its declared size', () => {
        RASTER_ASSETS.forEach(({ path: relativePath, width, height }) =>
            assert.deepEqual(
                pngSize(readAsset(relativePath)),
                [width, height],
                relativePath
            )
        );
    });

    it('ship every manifest icon at its declared size', () => {
        JSON.parse(webManifest()).icons.forEach(({ sizes, src }) =>
            assert.deepEqual(
                pngSize(readAsset(`public${src}`)).join('x'),
                sizes,
                src
            )
        );
    });

    it('pack 16/32/48 PNG frames into favicon.ico', () => {
        const ico = readAsset('public/static/favicon/favicon.ico');
        const frames = Array.from(
            { length: ico.readUInt16LE(4) },
            (_, index) => {
                const entry = 6 + index * 16;
                const offset = ico.readUInt32LE(entry + 12);
                const frame = ico.subarray(
                    offset,
                    offset + ico.readUInt32LE(entry + 8)
                );

                assert.deepEqual(pngSize(frame), [ico[entry], ico[entry + 1]]);

                return ico[entry];
            }
        );

        assert.deepEqual(frames, ICO_SIZES);
    });
});
