// Every combination scaffolded, checked by every registered formatter,
// type-checked (TypeScript), built with the workspace `@loom-js/build`, and
// its output asserted. Run via `pnpm test-ci`.
import { after, before, describe, it } from 'node:test';

import {
    appDirectoryOf,
    argvOf,
    binOf,
    combinations,
    linkDependencies,
    loomBin,
    nameOf,
    readTree,
    scaffold,
    tempRoot
} from './support.mjs';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const { REGISTRIES } = await import('../dist/index.mjs');

const exec = promisify(execFile);
const CONCURRENCY = 8;

const runIn = (cwd, command, args) =>
    exec(command, args, { cwd, maxBuffer: 16 * 1024 * 1024 });

const builtFiles = async (buildDirectory, extension) =>
    (await readdir(buildDirectory, { recursive: true }))
        .filter((file) => file.endsWith(extension))
        .map((file) => path.join(buildDirectory, file));

const concatenated = async (files) =>
    (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');

describe(
    'formatter check on every combination',
    { concurrency: CONCURRENCY },
    () => {
        let root;

        before(async () => {
            root = await tempRoot('format');
        });
        after(() => rm(root, { force: true, recursive: true }));

        for (const formatter of REGISTRIES.formatters) {
            for (const combo of combinations()) {
                it(`${formatter.id}: ${nameOf(combo)}`, async () => {
                    const cwd = path.join(root, formatter.id);
                    const { code, io } = await scaffold(
                        await ensureDirectory(cwd),
                        argvOf(combo, formatter.id)
                    );

                    assert.equal(code, 0, io.errors.join('\n'));

                    const [bin, ...args] = formatter.checkCommand;

                    await runIn(
                        path.join(cwd, nameOf(combo)),
                        binOf(bin),
                        args
                    );
                });
            }
        }
    }
);

describe('every combination builds', { concurrency: CONCURRENCY }, () => {
    let root;

    before(async () => {
        root = await tempRoot('build');
    });
    after(() => rm(root, { force: true, recursive: true }));

    for (const combo of combinations()) {
        it(nameOf(combo), async () => {
            const { code, io } = await scaffold(root, argvOf(combo, 'biome'));

            assert.equal(code, 0, io.errors.join('\n'));

            const app = appDirectoryOf(root, combo);
            const files = await readTree(app);

            await linkDependencies(app);

            if (combo.tailwind) {
                await runIn(app, binOf('tailwindcss'), [
                    '-i',
                    './src/styles.css',
                    '-o',
                    './.generated/styles.css'
                ]);
            }

            if (!combo.js) {
                await runIn(app, binOf('tsc'), ['--noEmit']);
            }

            await runIn(app, process.execPath, [loomBin, 'build']);
            await assertOutput(combo, app, files);
        });
    }
});

const ensureDirectory = async (directory) => {
    await import('node:fs/promises').then(({ mkdir }) =>
        mkdir(directory, { recursive: true })
    );

    return directory;
};

const assertOutput = async (combo, app, files) => {
    const build = path.join(app, 'build');
    const home = await readFile(path.join(build, 'index.html'), 'utf8');
    const about = await readFile(path.join(build, 'about/index.html'), 'utf8');
    const scripts = await concatenated(await builtFiles(build, '.js'));
    const styles = await concatenated(await builtFiles(build, '.css'));
    const config = files[combo.js ? 'loom.config.mjs' : 'loom.config.ts'];

    // Dev reload never ships.
    assert.ok(
        !scripts.includes('/esbuild'),
        'production JS references /esbuild'
    );

    if (combo.spa) {
        assert.match(home, /<div id="loom-app"[^>]*><\/div>/);
        assert.match(home, /<script id="loom-state"[^>]*><\/script>/);
        assert.ok(!/prerender/.test(config));
    } else {
        assert.match(home, /<h1>Welcome to loom<\/h1>/);
        assert.match(about, /<h1>About<\/h1>/);
        assert.match(home, /<script id="loom-state" type="application\/json">/);
        assert.match(
            about,
            /<script id="loom-state" type="application\/json">/
        );
    }

    if (combo.js) {
        assert.deepEqual(
            Object.keys(files).filter((file) => /\.(ts|mts)$/.test(file)),
            []
        );
    }

    if (combo.ui === 'pink') {
        assert.match(home, /<body class="theme-light">/);
        assert.match(styles, /@layer[^;]*\bpink\b/);

        if (!combo.spa) {
            assert.match(home, /id="welcome-card"/);
        }
    }

    if (combo.tailwind) {
        assert.match(styles, /\.max-w-3xl\b/);

        if (combo.ui === 'pink') {
            // The kit's layer-order statement, wherever the bundler put it.
            const order =
                styles.match(/@layer ([\w, -]*\bpink\b[\w, -]*);/)?.[1] ?? '';

            assert.ok(
                order.includes('utilities') &&
                    order.indexOf('pink') < order.indexOf('utilities'),
                `layer order "${order}" puts pink after utilities`
            );
        }
    }
};
