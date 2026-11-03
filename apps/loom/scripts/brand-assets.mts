// Regenerates every brand file from `project/client/brand.mts`: the SVGs and
// manifest as text, the PNGs as headless-Chrome renders, and `favicon.ico`
// packed from 16/32/48 renders. Run by hand: `pnpm -F @loom-js/loom brand-assets`.
import puppeteer, { type Page } from 'puppeteer';

import {
    ICO_SIZES,
    markSvg,
    PREVIEW_FONTS,
    PREVIEW_TEXT,
    RASTER_ASSETS,
    SITE_DESCRIPTION,
    TEXT_ASSETS,
    WORDMARK,
    type MarkVariant
} from '../project/client/brand.mts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const ICO_PATH = 'public/static/favicon/favicon.ico';

const write = async (relativePath: string, contents: string | Uint8Array) => {
    const target = path.resolve(APP_ROOT, relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
    console.log(`[brand-assets] ${path.relative(process.cwd(), target)}`);
};

const fontFace = async (family: string, relativePath: string) =>
    `@font-face{font-family:${family};src:url(data:font/woff2;base64,${(
        await readFile(path.resolve(APP_ROOT, relativePath))
    ).toString('base64')}) format('woff2')}`;

// The wordmark and tagline beside the mark, in fonts inlined into the page
// so the render never depends on what the machine has installed.
const lockupMarkup = async (image: string, height: number) => {
    const fonts =
        (await fontFace('Wordmark', PREVIEW_FONTS.wordmark)) +
        (await fontFace('Tagline', PREVIEW_FONTS.tagline));
    const wordmarkSize = Math.round(height * 0.24);
    const taglineSize = Math.round(height * 0.05);
    // Hyphenated words never break across lines.
    const tagline = SITE_DESCRIPTION.replace(
        /\S+-\S+/g,
        (word) => `<span style="white-space:nowrap">${word}</span>`
    );

    return (
        `<style>${fonts}</style>` +
        `<div style="display:flex;align-items:center;gap:${Math.round(height * 0.09)}px">${image}` +
        `<div><div style="font:${wordmarkSize}px/1 Wordmark;color:${PREVIEW_TEXT.wordmark}">${WORDMARK}</div>` +
        `<div style="font:${taglineSize}px/1.3 Tagline;color:${PREVIEW_TEXT.tagline};max-width:${taglineSize * 16}px;text-wrap:balance;margin-top:${Math.round(height * 0.03)}px">${tagline}</div></div></div>`
    );
};

const render = async (
    page: Page,
    {
        width,
        height,
        variant,
        ground,
        scale,
        lockup
    }: {
        width: number;
        height: number;
        variant: Exclude<MarkVariant, 'mono'>;
        ground?: string;
        scale: number;
        lockup?: boolean;
    }
) => {
    const diameter = Math.round(Math.min(width, height) * scale);
    const source = `data:image/svg+xml;base64,${Buffer.from(markSvg(variant)).toString('base64')}`;

    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const image = `<img src="${source}" width="${diameter}" height="${diameter}">`;

    await page.setContent(
        `<body style="margin:0;width:${width}px;height:${height}px;display:grid;place-items:center;background:${ground ?? 'transparent'}">` +
            `${lockup ? await lockupMarkup(image, height) : image}</body>`
    );
    await page.evaluate(() => document.fonts.ready);

    return page.screenshot({ omitBackground: !ground, type: 'png' });
};

// ICO header + directory around PNG frames (PNG-in-ICO, Vista and later).
const packIco = (frames: { png: Uint8Array; size: number }[]) => {
    const header = Buffer.alloc(6 + frames.length * 16);
    let offset = header.length;

    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(frames.length, 4);
    frames.forEach(({ png, size }, index) => {
        const entry = 6 + index * 16;

        header.writeUInt8(size >= 256 ? 0 : size, entry);
        header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
        header.writeUInt8(0, entry + 2);
        header.writeUInt8(0, entry + 3);
        header.writeUInt16LE(1, entry + 4);
        header.writeUInt16LE(32, entry + 6);
        header.writeUInt32LE(png.length, entry + 8);
        header.writeUInt32LE(offset, entry + 12);
        offset += png.length;
    });

    return Buffer.concat([header, ...frames.map(({ png }) => png)]);
};

for (const [relativePath, contents] of Object.entries(TEXT_ASSETS)) {
    await write(relativePath, contents());
}

const browser = await puppeteer.launch();

try {
    const page = await browser.newPage();

    for (const asset of RASTER_ASSETS) {
        await write(asset.path, await render(page, asset));
    }

    const frames = [];

    for (const size of ICO_SIZES) {
        frames.push({
            png: await render(page, {
                width: size,
                height: size,
                variant: 'light',
                scale: 1
            }),
            size
        });
    }

    await write(ICO_PATH, packIco(frames));
} finally {
    await browser.close();
}
