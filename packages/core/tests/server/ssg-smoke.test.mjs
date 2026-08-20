// SSG smoke: prerender a small example app to static HTML files, the way a
// build script would — one linkedom window per page, app markup injected into
// an HTML shell, written to disk.
import { parseHTML } from 'linkedom';
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { component, locationEffect } = await import('../../dist/index.mjs');
const { renderToString } = await import('../../dist/server.mjs');

const PAGES = [
    { route: '/', title: 'Home', body: 'Welcome to the example app.' },
    { route: '/about', title: 'About', body: 'A tiny SSG-rendered page.' }
];

const Page = component(
    (html, { body, title }) => html`
        <main>
            <h1>${title}</h1>
            <p>${body}</p>
            <footer>
                path:
                ${locationEffect(({ value: location }) => location.pathname)}
            </footer>
        </main>
    `
);

const shell = (title, markup) => `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>${title}</title>
    </head>
    <body>
        ${markup}
    </body>
</html>
`;

describe('SSG smoke', () => {
    it('prerenders each page of an example app to a static HTML file', async () => {
        const outDir = await mkdtemp(join(tmpdir(), 'loom-ssg-'));

        for (const { body, route, title } of PAGES) {
            const { window } = parseHTML('<html><body></body></html>');
            // `renderToString` is async — the go-to for a build script, since
            // it also settles lazily-imported route content before serializing.
            const markup = await renderToString(Page({ body, title }), {
                url: `https://example.com${route}`,
                window
            });
            const fileName =
                route === '/' ? 'index.html' : `${route.slice(1)}.html`;

            await writeFile(join(outDir, fileName), shell(title, markup));
        }

        const home = await readFile(join(outDir, 'index.html'), 'utf8');
        const about = await readFile(join(outDir, 'about.html'), 'utf8');

        assert.match(home, /^<!doctype html>/);
        assert.match(home, /<title>Home<\/title>/);
        assert.match(home, /<h1>Home<\/h1>/);
        assert.match(home, /Welcome to the example app\./);
        assert.match(about, /<h1>About<\/h1>/);
        assert.match(about, /A tiny SSG-rendered page\./);
    });
});
