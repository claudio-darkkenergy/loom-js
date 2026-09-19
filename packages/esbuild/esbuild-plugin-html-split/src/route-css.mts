import { build as esbuildBuild } from 'esbuild';
import type { BuildOptions, Metafile } from 'esbuild';

import { getResourcePath } from './helpers.mjs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The chunk-name scope a route's outputs carry — the '/'-route convention
 * ('/pages') mirrors the html emission.
 */
export const routeScopeOf = (route: string) =>
    route === '/' ? '/pages' : route;

/**
 * Splits CSS delivery by route: decides which css inputs each route owns
 * (via the metafile's import graph), rewrites the entry stylesheet to
 * shared-only and each route bundle to owned-only, and returns the
 * route-assets manifest (route pattern -> css URLs) for the templates.
 */
export const applyRouteScopedCss = async ({
    buildOptions,
    dynamicChunkPaths,
    inputs,
    outdir,
    outputs,
    routes,
    spa
}: {
    buildOptions: BuildOptions;
    dynamicChunkPaths: Set<string>;
    inputs: Metafile['inputs'];
    outdir: string;
    outputs: Metafile['outputs'];
    routes: string[];
    spa: string;
}): Promise<Record<string, string[]>> => {
    const routeAssets: Record<string, string[]> = {};

    if (!spa || !routes.length) {
        return routeAssets;
    }

    // Reverse import graph: css input -> the js/css inputs that
    // import it. Ownership follows importers, not bundles — a
    // css file can sit in a route's bundle yet be imported by
    // shared code too (a shared layout), which keeps it shared.
    const importersOf: Record<string, string[]> = {};

    for (const [inputPath, meta] of Object.entries(inputs)) {
        meta.imports.forEach(({ path: imported }) => {
            (importersOf[imported] ??= []).push(inputPath);
        });
    }

    // Per-route: the js subgraph (route chunk inputs) and the
    // css bundle files + their inputs.
    const routeJsInputs: Record<string, Set<string>> = {};
    const routeCssBundles: Record<string, string[]> = {};

    for (const route of routes) {
        const chunkPrefix = `${routeScopeOf(route).slice(1)}-`;

        for (const [outputPath, meta] of Object.entries(outputs)) {
            if (
                !/\.js$/.test(outputPath) ||
                !dynamicChunkPaths.has(outputPath) ||
                !path.basename(outputPath).startsWith(chunkPrefix)
            ) {
                continue;
            }

            Object.keys(meta.inputs).forEach((input) =>
                (routeJsInputs[route] ??= new Set()).add(input)
            );
            meta.cssBundle &&
                (routeCssBundles[route] ??= []).push(meta.cssBundle);
        }
    }

    // A css input is owned by a route when every importer,
    // followed through css @import chains, lives in that
    // route's js subgraph.
    const ownedBy = (cssInput: string, route: string): boolean => {
        const subgraph = routeJsInputs[route];
        const pending = [cssInput];
        const seen = new Set<string>();

        while (pending.length) {
            const current = pending.pop() as string;

            if (seen.has(current)) continue;
            seen.add(current);

            for (const importer of importersOf[current] ?? []) {
                if (/\.css$/.test(importer)) {
                    pending.push(importer);
                } else if (!subgraph?.has(importer)) {
                    return false;
                }
            }
        }

        return true;
    };

    // Rewrites a css bundle in place from a subset of its
    // inputs, preserving their original order. Requires
    // build-stable css-module names — the parent build must not
    // minify identifiers.
    const rewriteCssBundle = async (
        bundlePath: string,
        keptInputs: string[]
    ) => {
        const syntheticPath = path.join(
            process.cwd(),
            `.html-split-${path.basename(bundlePath)}.entry.css`
        );
        const entryName = getResourcePath({
            outdir,
            path: bundlePath
        }).replace(/^\/|\.css$/g, '');

        await writeFile(
            syntheticPath,
            keptInputs.map((input) => `@import "./${input}";`).join('\n')
        );

        try {
            await esbuildBuild({
                allowOverwrite: true,
                bundle: true,
                entryNames: entryName,
                entryPoints: [syntheticPath],
                loader: buildOptions.loader,
                logLevel: 'silent',
                minifySyntax: buildOptions.minifySyntax,
                minifyWhitespace: buildOptions.minifyWhitespace,
                outdir,
                sourcemap: buildOptions.sourcemap
            });
        } finally {
            await rm(syntheticPath, { force: true });
        }
    };

    const spaEntry = Object.entries(outputs).find(
        ([outputPath, meta]) =>
            meta.entryPoint && new RegExp(`${spa}\\.js$`).test(outputPath)
    );
    const entryCssPath = spaEntry?.[1].cssBundle;
    const routeOwned = new Set<string>();

    for (const route of routes) {
        for (const bundlePath of routeCssBundles[route] ?? []) {
            const bundleInputs = Object.keys(outputs[bundlePath]?.inputs ?? {});
            const owned = bundleInputs.filter((input) => ownedBy(input, route));

            owned.forEach((input) => routeOwned.add(input));

            // The route bundle keeps only what the route owns —
            // shared rules live in the entry stylesheet alone,
            // so no rule applies twice.
            if (owned.length < bundleInputs.length) {
                await rewriteCssBundle(bundlePath, owned);
            }

            owned.length &&
                (routeAssets[route] ??= []).push(
                    getResourcePath({ outdir, path: bundlePath })
                );
        }
    }

    const entryCssInputs = entryCssPath
        ? Object.keys(outputs[entryCssPath]?.inputs ?? {})
        : [];
    const sharedInputs = entryCssInputs.filter(
        (input) => !routeOwned.has(input)
    );

    if (entryCssPath && routeOwned.size > 0 && sharedInputs.length > 0) {
        await rewriteCssBundle(entryCssPath, sharedInputs);
    }

    return routeAssets;
};
