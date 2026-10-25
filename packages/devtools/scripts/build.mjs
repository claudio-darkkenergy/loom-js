// Builds `@loom-js/devtools` in two steps:
// 1. the HUD frontend — its own core, pink and app — into one script and one
//    stylesheet, written to `dist/frontend.{js,css}`;
// 2. the backend entry, with the frontend inlined as two string constants,
//    to `dist/index.mjs` (+ `dist/index.d.ts` from tsc).
// `--frontend-only` stops after step 1 (the tests inline it themselves).
import { build } from 'esbuild';

import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const frontendOnly = process.argv.includes('--frontend-only');

// Keeps an inlined script or style from closing its own element early.
const escapeClosingTag = (source, tag) =>
    source.replaceAll(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);

/** Bundles the HUD and returns its script and stylesheet text. */
export const buildFrontend = async () => {
    const { outputFiles } = await build({
        absWorkingDir: root,
        bundle: true,
        entryPoints: ['src/frontend/index.ts'],
        format: 'esm',
        loader: {
            '.eot': 'empty',
            '.svg': 'dataurl',
            '.ttf': 'empty',
            '.woff': 'empty',
            '.woff2': 'empty'
        },
        logLevel: 'warning',
        minify: true,
        outdir: 'dist/frontend',
        target: 'es2022',
        write: false
    });
    const textOf = (extension) =>
        outputFiles.find(({ path: filePath }) => filePath.endsWith(extension))
            ?.text ?? '';

    return {
        script: escapeClosingTag(textOf('.js'), 'script'),
        style: escapeClosingTag(textOf('.css'), 'style')
    };
};

const run = async () => {
    await rm(dist, { force: true, recursive: true });
    await mkdir(dist, { recursive: true });

    const { script, style } = await buildFrontend();

    await writeFile(path.join(dist, 'frontend.js'), script);
    await writeFile(path.join(dist, 'frontend.css'), style);

    if (frontendOnly) {
        return;
    }

    await build({
        absWorkingDir: root,
        bundle: true,
        define: {
            __LOOM_DEVTOOLS_FRONTEND_SCRIPT__: JSON.stringify(script),
            __LOOM_DEVTOOLS_FRONTEND_STYLE__: JSON.stringify(style)
        },
        entryPoints: ['src/index.ts'],
        external: ['@loom-js/core', '@loom-js/core/*'],
        format: 'esm',
        logLevel: 'warning',
        minify: true,
        outfile: 'dist/index.mjs',
        sourcemap: true,
        target: 'es2022'
    });
    await promisify(execFile)(
        process.execPath,
        [
            path.join(root, 'node_modules/typescript/bin/tsc'),
            '-p',
            'tsconfig.json',
            '--noEmit',
            'false',
            '--emitDeclarationOnly',
            '--declarationDir',
            'dist/types'
        ],
        { cwd: root }
    );
    await writeFile(
        path.join(dist, 'index.d.ts'),
        "export * from './types/index';\n"
    );
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

isMain &&
    (await run().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    }));

export const readFrontend = async () => ({
    script: await readFile(path.join(dist, 'frontend.js'), 'utf8'),
    style: await readFile(path.join(dist, 'frontend.css'), 'utf8')
});
