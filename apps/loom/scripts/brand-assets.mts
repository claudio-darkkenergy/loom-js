// Regenerates every brand file from `project/client/brand.mts`: the SVGs and
// manifest as text, the PNGs as headless-Chrome renders, and `favicon.ico`
// packed from 16/32/48 renders. Run by hand: `pnpm -F @loom-js/loom brand-assets`.
import puppeteer, { type Page } from 'puppeteer';

import {
    ICO_SIZES,
    markSvg,
    RASTER_ASSETS,
    TEXT_ASSETS,
    type MarkVariant
} from '../project/client/brand.mts';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const APP_ROOT = path.resolve(import.meta.dirname, '..');
const ICO_PATH = 'public/static/favicon/favicon.ico';

const write = async (relativePath: string, contents: string | Uint8Array) => {
    const target = path.resolve(APP_ROOT, relativePath);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
    console.log(`[brand-assets] ${path.relative(process.cwd(), target)}`);
};

const render = async (
    page: Page,
    {
        width,
        height,
        variant,
        ground,
        scale
    }: {
        width: number;
        height: number;
        variant: Exclude<MarkVariant, 'mono'>;
        ground?: string;
        scale: number;
    }
) => {
    const diameter = Math.round(Math.min(width, height) * scale);
    const source = `data:image/svg+xml;base64,${Buffer.from(markSvg(variant)).toString('base64')}`;

    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(
        `<body style="margin:0;width:${width}px;height:${height}px;display:grid;place-items:center;background:${ground ?? 'transparent'}">` +
            `<img src="${source}" width="${diameter}" height="${diameter}"></body>`
    );

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
