// Builds every framework's bench page into `<distDir>/<id>/` and reports
// each JavaScript bundle's size. Prod settings across the board.
import { build as esbuild } from 'esbuild';

import { shellHtml } from '../shared/shell.ts';
import type { FrameworkId } from '../types.ts';
import { FRAMEWORKS, type FrameworkSpec } from './frameworks.ts';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

export interface BuiltFramework {
    spec: FrameworkSpec;
    /** The page to load, relative to `distDir` (served at `/`). */
    pagePath: string;
    bundle: { bytes: number; gzipBytes: number };
}

const SCRIPT_NAME = 'app.js';

const buildOne = async (
    root: string,
    distDir: string,
    spec: FrameworkSpec
): Promise<BuiltFramework> => {
    const outDir = path.join(distDir, spec.id);
    const entryPath = path.join(root, spec.entry);

    await mkdir(outDir, { recursive: true });

    const result = await esbuild({
        absWorkingDir: root,
        bundle: true,
        entryPoints: { [SCRIPT_NAME.replace(/\.js$/, '')]: entryPath },
        format: 'esm',
        ...spec.jsx,
        logLevel: 'silent',
        metafile: true,
        minify: true,
        outdir: outDir,
        plugins: spec.plugins,
        sourcemap: false,
        // The frameworks read this to pick their production builds.
        define: { 'process.env.NODE_ENV': '"production"' },
        target: 'es2022'
    }).catch((error: unknown) => {
        throw new Error(
            `[bench] ${spec.id}: bundle build failed — ${error instanceof Error ? error.message : String(error)}`
        );
    });

    const outputPath = path.join(outDir, SCRIPT_NAME);
    const output = Object.entries(result.metafile.outputs).find(
        ([file]) => path.resolve(root, file) === outputPath
    );

    if (!output) {
        throw new Error(
            `[bench] ${spec.id}: build produced no ${SCRIPT_NAME}.`
        );
    }

    const emitted = await readFile(outputPath);

    await writeFile(
        path.join(outDir, 'index.html'),
        shellHtml(`/${spec.id}/${SCRIPT_NAME}`)
    );

    return {
        spec,
        pagePath: `/${spec.id}/index.html`,
        bundle: {
            bytes: output[1].bytes,
            gzipBytes: gzipSync(emitted, { level: 9 }).byteLength
        }
    };
};

/**
 * Builds the bench pages for every registered framework (or the subset in
 * `only`) into `distDir`, wiped first. Throws naming the framework whose
 * entry is missing or whose build fails.
 */
export const buildAll = async (
    root: string,
    distDir: string,
    only?: FrameworkId[]
): Promise<BuiltFramework[]> => {
    const specs = only
        ? FRAMEWORKS.filter(({ id }) => only.includes(id))
        : FRAMEWORKS;

    await rm(distDir, { force: true, recursive: true });
    await mkdir(distDir, { recursive: true });
    await copyFile(
        path.join(root, 'src/shared/styles.css'),
        path.join(distDir, 'styles.css')
    );

    const built: BuiltFramework[] = [];

    for (const spec of specs) {
        built.push(await buildOne(root, distDir, spec));
        console.info(
            `> built ${spec.id} (${built.at(-1)?.bundle.gzipBytes} bytes gzip)`
        );
    }

    return built;
};
