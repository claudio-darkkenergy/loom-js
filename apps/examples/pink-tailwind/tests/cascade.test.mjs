import { after, before, describe, it } from 'node:test';
import puppeteer from 'puppeteer';

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const buildDir = fileURLToPath(new URL('../build/', import.meta.url));
const pinkCssPath = createRequire(import.meta.url).resolve(
    '@loom-js/pink/pink.css'
);
const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.woff2': 'font/woff2'
};
// Box properties pink sets on a button; preflight resets each of them.
const buttonProps = [
    'background-color',
    'border-top-left-radius',
    'border-top-width',
    'color',
    'font-size',
    'height',
    'padding-left',
    'padding-top'
];

let browser;
let origin;
let server;

// `/pink-only` serves the same app with pink's stylesheet and no Tailwind.
const handle = async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    let body;
    let filePath = path.join(buildDir, url.pathname);

    // The shell has no favicon; keep the browser's probe out of the console.
    if (url.pathname === '/favicon.ico') {
        response.writeHead(204).end();
        return;
    }

    if (url.pathname === '/pink.css') {
        filePath = pinkCssPath;
    } else if (url.pathname === '/' || url.pathname === '/pink-only') {
        filePath = path.join(buildDir, 'index.html');
    }

    try {
        body = await readFile(filePath);
    } catch {
        response.writeHead(404).end();
        return;
    }

    if (url.pathname === '/pink-only') {
        body = String(body).replace('/static/styles/styles.css', '/pink.css');
    }

    response.writeHead(200, {
        'content-type':
            contentTypes[path.extname(filePath)] ?? 'application/octet-stream'
    });
    response.end(body);
};

const openPage = async (pathname) => {
    const errors = [];
    const page = await browser.newPage();

    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${origin}${pathname}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#pink-button');

    return { errors, page };
};

const computed = (page, selector, props) =>
    page.$eval(
        selector,
        (element, names) => {
            const style = getComputedStyle(element);

            return Object.fromEntries(
                names.map((name) => [name, style.getPropertyValue(name)])
            );
        },
        props
    );

describe('pink with Tailwind', () => {
    before(async () => {
        server = createServer(handle);
        await new Promise((resolve) => server.listen(0, resolve));
        origin = `http://localhost:${server.address().port}`;
        browser = await puppeteer.launch();
    });

    after(async () => {
        await browser?.close();
        server?.close();
    });

    it('renders with a clean console', async () => {
        const { errors, page } = await openPage('/');

        assert.deepEqual(errors, []);
        await page.close();
    });

    it('lets Tailwind utilities override pink', async () => {
        const { page } = await openPage('/');
        const expected = await page.evaluate(() => {
            const probe = document.createElement('div');

            probe.className = 'bg-red-500';
            document.body.append(probe);

            return getComputedStyle(probe).backgroundColor;
        });
        const { 'background-color': actual } = await computed(
            page,
            '#utility-button',
            ['background-color']
        );

        assert.equal(actual, expected);
        await page.close();
    });

    it('keeps preflight from flattening pink', async () => {
        const withTailwind = await openPage('/');
        const pinkOnly = await openPage('/pink-only');
        const actual = await computed(
            withTailwind.page,
            '#pink-button',
            buttonProps
        );
        const expected = await computed(
            pinkOnly.page,
            '#pink-button',
            buttonProps
        );

        assert.notEqual(actual['padding-left'], '0px');
        assert.deepEqual(actual, expected);
        await withTailwind.page.close();
        await pinkOnly.page.close();
    });

    it('puts consumer classes on the root as written', async () => {
        const { page } = await openPage('/');
        const classes = await page.$eval('#utility-tag', (element) => [
            ...element.classList
        ]);

        for (const name of ['mt-4', 'uppercase', 'tag', 'is-success']) {
            assert.ok(classes.includes(name), `missing ${name}`);
        }
        await page.close();
    });
});
