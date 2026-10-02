// The prerender phase: renders every route the app enumerates through the
// prerender bundle and injects markup + dehydrated state into the emitted
// shells. The pipeline is the tool's; the app supplies the hooks.
import { injectPrerender } from '@loom-js/core/server';
import { parseHTML } from 'linkedom';

import type {
    PrerenderBundle,
    PrerenderOptions,
    PrerenderOutput,
    ResolvedConfig
} from './config';
import { PRERENDER_ENTRY_NAME } from './template';
import {
    access,
    copyFile,
    mkdir,
    readdir,
    readFile,
    writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** The pristine root shell, kept beside `index.html` for SPA fallback serving. */
export const ROOT_SHELL_FILE = 'shell.html';

// Any origin works — only the pathname participates in route matching.
const ORIGIN = 'https://loom.local';

const freshWindow = () =>
    parseHTML('<!DOCTYPE html><html><head></head><body></body></html>')
        .window as object;

const exists = (filePath: string) =>
    access(filePath).then(
        () => true,
        () => false
    );

/** The configured route that is the longest path-prefix of `route`. */
export const shellRouteOf = (route: string, routes: string[]) => {
    const isPrefix = (candidate: string) =>
        candidate === '/' ||
        route === candidate ||
        route.startsWith(`${candidate}/`);
    const [best] = routes
        .filter(isPrefix)
        .sort((left, right) => right.length - left.length);

    if (!best) {
        throw new Error(
            `[prerender] no configured route is a prefix of "${route}" — add its section to \`routes\`.`
        );
    }

    return best;
};

/** The output path of a route's HTML under `outDir`. */
export const routeOutputPath = (outDir: string, route: string) =>
    path.join(outDir, route === '/' ? '' : route, 'index.html');

// The shell `emit` reads for a route — kept pristine so a re-run (`loom
// prerender`) never injects into already-injected markup. The root shell
// lives at `shell.html`; a section route that is itself prerendered gets a
// sibling `shell.html` too.
const shellFileOf = (outDir: string, shellRoute: string) =>
    path.join(path.dirname(routeOutputPath(outDir, shellRoute)), ROOT_SHELL_FILE);

const injectFontPreloads = (shellHtml: string, fontFiles: string[]) => {
    if (!fontFiles.length) {
        return shellHtml;
    }

    const preloads = fontFiles
        .map(
            (file) =>
                `    <link as="font" crossorigin href="/${file}" rel="preload" type="font/woff2" />\n`
        )
        .join('');

    // Re-runs read shells that already carry the preloads.
    if (shellHtml.includes(preloads)) {
        return shellHtml;
    }

    // Ahead of the first stylesheet link when there is one, else at the
    // head's end — either way before the CSS that would discover the fonts.
    const anchor = shellHtml.includes('    <link ')
        ? '    <link '
        : '</head>';

    return shellHtml.replace(anchor, () => preloads.concat(anchor));
};

const loadBundle = async (outDir: string): Promise<PrerenderBundle> => {
    const bundlePath = path.join(outDir, `${PRERENDER_ENTRY_NAME}.js`);

    if (!(await exists(bundlePath))) {
        throw new Error(
            `[prerender] ${PRERENDER_ENTRY_NAME}.js is missing from ${outDir} — run \`loom build\` first.`
        );
    }

    const bundle = (await import(pathToFileURL(bundlePath).href)) as Partial<
        PrerenderBundle
    >;

    if (typeof bundle.prerenderRoute !== 'function') {
        throw new Error(
            '[prerender] the prerender entry must export `prerenderRoute(url, window)`.'
        );
    }

    return bundle as PrerenderBundle;
};

const checkOutput = (route: string, { html, state }: PrerenderOutput) => {
    if (!html.trim()) {
        throw new Error(
            `[prerender] ${route} rendered no markup — failing the build.`
        );
    }

    try {
        JSON.parse(state);
    } catch {
        throw new Error(
            `[prerender] ${route} produced a state payload that is not JSON — serialize it with \`serializeState\`.`
        );
    }
};

/**
 * Runs the prerender phase against an existing `outDir`: loads the bundle,
 * preserves the pristine shells, renders every enumerated route into its
 * section's shell, and writes one `index.html` per route. Re-runnable.
 */
export const prerender = async (config: ResolvedConfig) => {
    const hooks = config.prerender;

    if (!hooks) {
        throw new Error('[prerender] the config has no `prerender` section.');
    }


    const { outDir, routes: configuredRoutes } = config;
    const bundle = await loadBundle(outDir);

    await hooks.setup?.(bundle);

    const routes = await hooks.routes(bundle);
    const shellRoutes = new Set(
        routes.map((route) => shellRouteOf(route, configuredRoutes))
    );

    // Root always gets `shell.html` (the SPA fallback contract); sections
    // only when one of their routes is rendered over their own index.
    shellRoutes.add('/');

    const fontFiles = hooks.preloadFonts
        ? (await readdir(outDir)).filter((file) => file.endsWith('.woff2'))
        : [];
    const shells = new Map<string, string>();

    for (const shellRoute of shellRoutes) {
        const shellFile = shellFileOf(outDir, shellRoute);
        const indexFile = routeOutputPath(outDir, shellRoute);
        const isSectionRenderedInPlace =
            shellRoute !== '/' && routes.includes(shellRoute);

        // First run: the emitted index is still pristine. Re-run: the
        // preserved shell is.
        if (!(await exists(shellFile))) {
            if (shellRoute === '/' || isSectionRenderedInPlace) {
                await copyFile(indexFile, shellFile);
            }
        }

        const sourceFile = (await exists(shellFile)) ? shellFile : indexFile;
        const shellHtml = injectFontPreloads(
            await readFile(sourceFile, 'utf8'),
            fontFiles
        );

        shells.set(shellRoute, shellHtml);

        // The fallback shells get the preloads too.
        if (sourceFile === shellFile) {
            await writeFile(shellFile, shellHtml);
        }

        if (!routes.includes(shellRoute)) {
            await writeFile(indexFile, shellHtml);
        }
    }

    for (const route of routes) {
        const shellHtml = shells.get(shellRouteOf(route, configuredRoutes));
        const output = await bundle.prerenderRoute(
            `${ORIGIN}${route}`,
            freshWindow()
        );

        checkOutput(route, output);
        await hooks.validate?.(route, output, bundle);

        const outPath = routeOutputPath(outDir, route);

        await mkdir(path.dirname(outPath), { recursive: true });
        await writeFile(
            outPath,
            injectPrerender(shellHtml as string, {
                appHtml: output.html,
                stateJson: output.state
            })
        );
        console.info(`> prerendered ${route} -> ${path.relative(outDir, outPath)}`);
    }

    await hooks.after?.({ bundle, outDir });
    console.info(`> prerender complete: ${routes.length} route(s).`);
};

export type { PrerenderOptions };
