// The build-time SSG runner: renders every route through the prerender
// bundle and injects markup + dehydrated state into the emitted shells.
import { parseHTML } from 'linkedom';

import { injectPrerender } from '../../src/app/boot-contract.js';
import type {
    DocsTopicSummary,
    PrerenderTransportConfig
} from '../../src/app/prerender.entry.js';
import {
    copyFile,
    mkdir,
    readdir,
    readFile,
    writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface PrerenderBundle {
    configurePrerenderTransport: (config: PrerenderTransportConfig) => void;
    docsContentResourceKey: (topicSlug: string) => string;
    listDocsTopics: () => Promise<DocsTopicSummary[]>;
    prerenderRoute: (
        url: string,
        window: object
    ) => Promise<{ html: string; state: string }>;
}

// Any origin works — only the pathname participates in route matching.
const ORIGIN = 'https://loomjs.local';

// Font files are only discoverable through CSS url()s, which puts their
// download after first paint and swaps text metrics late — preloading them
// from the head removes that shift.
const injectFontPreloads = (shellHtml: string, fontFiles: string[]) => {
    const preloads = fontFiles
        .map(
            (file) =>
                `    <link as="font" crossorigin href="/${file}" rel="preload" type="font/woff2" />\n`
        )
        .join('');

    return shellHtml.replace('    <link rel="dns-prefetch"', () =>
        preloads.concat('    <link rel="dns-prefetch"')
    );
};

const freshWindow = () =>
    parseHTML('<!DOCTYPE html><html><head></head><body></body></html>')
        .window as object;

/**
 * Runs the SSG phase after the client build: enumerates the docs routes
 * from Contentful, renders home and every topic against a fresh linkedom
 * window, validates the output, and writes one `index.html` per route.
 *
 * Required env vars:
 * - `CTF_SPACE_ID` — Contentful space id (same value the API proxy uses).
 * - `CTF_TOKEN` — Contentful Delivery API token.
 * - `API_URL` / `CTF_IS_PREVIEW` — already required by the client build.
 */
export const prerender = async (outdir = './build') => {
    const buildDir = path.resolve(outdir);
    const spaceId = process.env.CTF_SPACE_ID;
    const token = process.env.CTF_TOKEN;

    if (!spaceId || !token) {
        throw new Error(
            '[prerender] CTF_SPACE_ID and CTF_TOKEN are required for the production prerender phase.'
        );
    }

    const {
        configurePrerenderTransport,
        docsContentResourceKey,
        listDocsTopics,
        prerenderRoute
    } = (await import(
        pathToFileURL(path.join(buildDir, 'static/js/prerender.js')).href
    )) as PrerenderBundle;

    configurePrerenderTransport({ spaceId, token });

    const topics = await listDocsTopics();

    // Preserve the pristine shells for SPA fallback BEFORE any injection:
    // build/shell.html backs the unknown-path rewrite, and build/docs/
    // index.html stays untouched as the unknown-topic fallback.
    await copyFile(
        path.join(buildDir, 'index.html'),
        path.join(buildDir, 'shell.html')
    );

    const fontFiles = (await readdir(buildDir)).filter((file) =>
        /^(font|icon)-[A-Z0-9]+\.woff2$/.test(file)
    );
    const homeShell = injectFontPreloads(
        await readFile(path.join(buildDir, 'index.html'), 'utf8'),
        fontFiles
    );
    const docsShell = injectFontPreloads(
        await readFile(path.join(buildDir, 'docs/index.html'), 'utf8'),
        fontFiles
    );

    // The fallback shells get the preloads too.
    await writeFile(path.join(buildDir, 'shell.html'), homeShell);
    await writeFile(path.join(buildDir, 'docs/index.html'), docsShell);

    const emit = async (
        routePath: string,
        shellHtml: string,
        outPath: string,
        validate: (html: string, state: string) => void
    ) => {
        const { html, state } = await prerenderRoute(
            `${ORIGIN}${routePath}`,
            freshWindow()
        );

        validate(html, state);
        await mkdir(path.dirname(outPath), { recursive: true });
        await writeFile(
            outPath,
            injectPrerender(shellHtml, { appHtml: html, stateJson: state })
        );
        console.info(`> prerendered ${routePath} -> ${outPath}`);
    };

    await emit('/', homeShell, path.join(buildDir, 'index.html'), (html) => {
        if (html.length < 1000) {
            throw new Error(
                '[prerender] home route rendered suspiciously little markup — failing the build.'
            );
        }
    });

    for (const { slug, title } of topics) {
        await emit(
            `/docs/${slug}`,
            docsShell,
            path.join(buildDir, 'docs', slug, 'index.html'),
            (html, state) => {
                // Settled content, not skeletons: the topic's own title must
                // have rendered, and its resource entry must ride the state.
                if (!html.includes(title)) {
                    throw new Error(
                        `[prerender] /docs/${slug} rendered without its topic content ("${title}") — failing the build.`
                    );
                }

                const stateKeys = Object.keys(JSON.parse(state));

                if (!stateKeys.includes(docsContentResourceKey(slug))) {
                    throw new Error(
                        `[prerender] /docs/${slug} state is missing its page-content resource — failing the build.`
                    );
                }
            }
        );
    }

    console.info(
        `> prerender complete: home + ${topics.length} docs topic(s).`
    );
};
