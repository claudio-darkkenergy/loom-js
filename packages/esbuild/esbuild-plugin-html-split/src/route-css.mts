import { build as esbuildBuild } from 'esbuild';
import type { BuildOptions, Metafile } from 'esbuild';

import { getResourcePath } from './helpers.mjs';
import { createHash } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The chunk-name scope a route's outputs carry — the '/'-route convention
 * ('/pages') mirrors the html emission.
 */
export const routeScopeOf = (route: string) =>
    route === '/' ? '/pages' : route;

interface RouteCssPlan {
    bundles: {
        bundlePath: string;
        inputCount: number;
        ownedInputs: string[];
        route: string;
    }[];
    entryCssPath?: string;
    sharedInputs: string[];
}

/**
 * Decides css ownership from the metafile: which inputs each route's
 * bundles own (every importer, followed through @import chains, lives in
 * that route's js subgraph) and which inputs stay shared in the entry
 * stylesheet.
 */
export const analyzeRouteCss = ({
    dynamicChunkPaths,
    inputs,
    outputs,
    routes,
    spa
}: {
    dynamicChunkPaths: Set<string>;
    inputs: Metafile['inputs'];
    outputs: Metafile['outputs'];
    routes: string[];
    spa: string;
}): RouteCssPlan => {
    const plan: RouteCssPlan = { bundles: [], sharedInputs: [] };

    if (!spa || !routes.length) {
        return plan;
    }

    // Reverse import graph: css input -> the js/css inputs that import it.
    const importersOf: Record<string, string[]> = {};

    for (const [inputPath, meta] of Object.entries(inputs)) {
        meta.imports.forEach(({ path: imported }) => {
            (importersOf[imported] ??= []).push(inputPath);
        });
    }

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

    const routeOwned = new Set<string>();

    for (const route of routes) {
        for (const bundlePath of routeCssBundles[route] ?? []) {
            const bundleInputs = Object.keys(outputs[bundlePath]?.inputs ?? {});
            const ownedInputs = bundleInputs.filter((input) =>
                ownedBy(input, route)
            );

            ownedInputs.forEach((input) => routeOwned.add(input));
            plan.bundles.push({
                bundlePath,
                inputCount: bundleInputs.length,
                ownedInputs,
                route
            });
        }
    }

    const spaEntry = Object.entries(outputs).find(
        ([outputPath, meta]) =>
            meta.entryPoint && new RegExp(`${spa}\\.js$`).test(outputPath)
    );

    plan.entryCssPath = spaEntry?.[1].cssBundle;
    plan.sharedInputs = (
        plan.entryCssPath
            ? Object.keys(outputs[plan.entryCssPath]?.inputs ?? {})
            : []
    ).filter((input) => !routeOwned.has(input));

    return plan;
};

const writeSyntheticEntry = async (name: string, cssInputs: string[]) => {
    const syntheticPath = path.join(process.cwd(), `.html-split-${name}.css`);

    await writeFile(
        syntheticPath,
        cssInputs.map((input) => `@import "./${input}";`).join('\n')
    );

    return syntheticPath;
};

/**
 * Single-pass mode: rewrites the entry stylesheet to shared-only and each
 * route bundle to owned-only via nested builds. Requires build-stable
 * css-module names — the parent build must not minify identifiers.
 */
export const applyRouteScopedCss = async ({
    buildOptions,
    outdir,
    plan
}: {
    buildOptions: BuildOptions;
    outdir: string;
    plan: RouteCssPlan;
}): Promise<Record<string, string[]>> => {
    const routeAssets: Record<string, string[]> = {};
    const rewriteCssBundle = async (
        bundlePath: string,
        keptInputs: string[]
    ) => {
        const entryName = getResourcePath({
            outdir,
            path: bundlePath
        }).replace(/^\/|\.css$/g, '');
        const syntheticPath = await writeSyntheticEntry(
            path.basename(bundlePath),
            keptInputs
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
    const anyOwned = plan.bundles.some(({ ownedInputs }) =>
        Boolean(ownedInputs.length)
    );

    for (const { bundlePath, inputCount, ownedInputs, route } of plan.bundles) {
        if (ownedInputs.length < inputCount) {
            await rewriteCssBundle(bundlePath, ownedInputs);
        }

        ownedInputs.length &&
            (routeAssets[route] ??= []).push(
                getResourcePath({ outdir, path: bundlePath })
            );
    }

    if (plan.entryCssPath && anyOwned && plan.sharedInputs.length) {
        await rewriteCssBundle(plan.entryCssPath, plan.sharedInputs);
    }

    return routeAssets;
};

/**
 * Two-pass mode: reruns the whole parent build once with synthetic shared
 * and per-route css entries added, so one mangle pool names the js and
 * every stylesheet — full identifier minification stays sound. The shared
 * synthetic overwrites the entry stylesheet path; route synthetics are
 * content-hashed for immutable caching. Returns the pass-2 metafile
 * (chunk names change) and the manifest.
 */
export const applyTwoPassCss = async ({
    initialOptions,
    outdir,
    passOneOutputs,
    plan
}: {
    initialOptions: BuildOptions;
    outdir: string;
    passOneOutputs: Metafile['outputs'];
    plan: RouteCssPlan;
}): Promise<{
    outputs: Metafile['outputs'];
    routeAssets: Record<string, string[]>;
    syntheticEntryPaths: string[];
}> => {
    const routeAssets: Record<string, string[]> = {};
    const synthetics: { in: string; out: string; route?: string }[] = [];
    const entryCssName = plan.entryCssPath
        ? getResourcePath({ outdir, path: plan.entryCssPath }).replace(
              /^\/|\.css$/g,
              ''
          )
        : undefined;

    if (entryCssName && plan.sharedInputs.length) {
        synthetics.push({
            in: await writeSyntheticEntry('shared', plan.sharedInputs),
            out: `${entryCssName}--shared`
        });
    }

    for (const { bundlePath, ownedInputs, route } of plan.bundles) {
        if (!ownedInputs.length) continue;

        const prefix = routeScopeOf(route).slice(1);

        synthetics.push({
            in: await writeSyntheticEntry(`${prefix}-route`, ownedInputs),
            out: `${prefix}--route`,
            route
        });
        void bundlePath;
    }

    // Normalize the parent's entryPoints into {in, out} records so the
    // synthetics can ride alongside them.
    const parentEntries = Array.isArray(initialOptions.entryPoints)
        ? (
              initialOptions.entryPoints as (
                  string | { in: string; out: string }
              )[]
          ).map((entry) =>
              typeof entry === 'string'
                  ? { in: entry, out: entry.replace(/\.[^.]+$/, '') }
                  : entry
          )
        : Object.entries(initialOptions.entryPoints ?? {}).map(
              ([out, input]) => ({ in: input as string, out })
          );
    // The plugin itself (and the clean/copy plugins, whose side effects
    // pass 1 already produced) must not run again inside pass 2.
    const passTwoPlugins = (initialOptions.plugins ?? []).filter(
        ({ name }) =>
            !['clean', 'copy', 'html-split-plugin'].some((dropped) =>
                name.includes(dropped)
            )
    );

    let outputs: Metafile['outputs'] = {};

    try {
        const result = await esbuildBuild({
            ...initialOptions,
            allowOverwrite: true,
            entryPoints: [
                ...parentEntries,
                ...synthetics.map(({ in: inPath, out }) => ({
                    in: inPath,
                    out
                }))
            ],
            logLevel: 'silent',
            metafile: true,
            plugins: passTwoPlugins
        });

        outputs = result.metafile.outputs;
    } finally {
        await Promise.all(
            synthetics.map(({ in: inPath }) => rm(inPath, { force: true }))
        );
    }

    const syntheticEntryPaths: string[] = [];

    for (const { in: inPath, out, route } of synthetics) {
        const emittedPath = path.join(outdir, `${out}.css`);

        if (route) {
            // Content-hash the route stylesheet so it stays
            // immutable-cacheable like every other hashed asset.
            const hash = createHash('sha256')
                .update(await readFile(emittedPath))
                .digest('hex')
                .slice(0, 8)
                .toUpperCase();
            const prefix = routeScopeOf(route).slice(1);
            const hashedPath = path.join(outdir, `${prefix}-${hash}.css`);

            await rename(emittedPath, hashedPath);
            (routeAssets[route] ??= []).push(
                getResourcePath({ outdir, path: hashedPath })
            );
        } else if (plan.entryCssPath) {
            // The shared synthetic becomes the entry stylesheet in place.
            await rename(emittedPath, plan.entryCssPath);
        }

        // Strip the synthetic from the metafile so classification never
        // links the pre-rename names.
        for (const [outputPath, meta] of Object.entries(outputs)) {
            if (meta.entryPoint === path.relative(process.cwd(), inPath)) {
                delete outputs[outputPath];
                syntheticEntryPaths.push(outputPath);
            }
        }
    }

    // Pass 2 owns the output set: remove pass-1 bundles it did not
    // re-emit (stale hashes) and both passes' auto route cssBundles —
    // the hashed synthetics replace them.
    const stale = new Set<string>(
        Object.keys(passOneOutputs).filter(
            (outputPath) =>
                /\.(js|css|map)$/.test(outputPath) && !outputs[outputPath]
        )
    );

    // Pass-2 auto cssBundles of route chunks: same detection as the
    // analysis (dynamic-import target + route scope prefix).
    const passTwoDynamic = new Set(
        Object.values(outputs).flatMap((meta) =>
            meta.imports
                .filter(({ kind }) => kind === 'dynamic-import')
                .map(({ path: importPath }) => importPath)
        )
    );
    const routePrefixes = plan.bundles.map(
        ({ route }) => `${routeScopeOf(route).slice(1)}-`
    );

    for (const [outputPath, meta] of Object.entries(outputs)) {
        meta.cssBundle &&
            passTwoDynamic.has(outputPath) &&
            routePrefixes.some((prefix) =>
                path.basename(outputPath).startsWith(prefix)
            ) &&
            stale.add(meta.cssBundle);
    }

    await Promise.all(
        [...stale].map((outputPath) => rm(outputPath, { force: true }))
    );

    return { outputs, routeAssets, syntheticEntryPaths };
};
