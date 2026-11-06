// Scaffolding helpers for the suites: run the CLI into a temp directory and
// link the workspace packages and tool binaries a real install would bring.
import { scriptedIo } from './helpers.mjs';
import {
    mkdir,
    mkdtemp,
    readdir,
    readFile,
    realpath,
    symlink
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { REGISTRIES, run } = await import('../dist/index.mjs');

export const createRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
);
export const workspaceRoot = path.resolve(createRoot, '../..');
export const binOf = (name) =>
    path.join(createRoot, 'node_modules', '.bin', name);
export const loomBin = path.join(workspaceRoot, 'packages/build/bin/loom.mjs');

export const NPM_AGENT = { npm_config_user_agent: 'npm/11.5.1 node/v24.14.0' };

export const tempRoot = (prefix) =>
    mkdtemp(path.join(tmpdir(), `create-${prefix}-`));

/** Runs the CLI non-interactively; resolves with the exit code and the io. */
export const scaffold = async (cwd, argv, env = NPM_AGENT, spawn) => {
    const io = scriptedIo();
    const code = await run({
        argv,
        cwd,
        env,
        io,
        spawn: spawn ?? (async () => ({ code: 0, stderr: '', stdout: '' }))
    });

    return { code, io };
};

/** Every file under `directory` (skipping `node_modules` and `build`), by path. */
export const readTree = async (directory) => {
    const entries = await readdir(directory, {
        recursive: true,
        withFileTypes: true
    });
    const files = {};

    for (const entry of entries) {
        const absolute = path.join(entry.parentPath, entry.name);
        const relative = path
            .relative(directory, absolute)
            .split(path.sep)
            .join('/');

        if (
            entry.isFile() &&
            !/(^|\/)(node_modules|build|\.git)\//.test(relative)
        ) {
            files[relative] = await readFile(absolute, 'utf8');
        }
    }

    return files;
};

const LINKED_TOOLS = ['typescript', 'tailwindcss', '@tailwindcss/cli'];

/** Links what `npm install` would put in `appDirectory/node_modules`. */
export const linkDependencies = async (appDirectory) => {
    const modules = path.join(appDirectory, 'node_modules');

    await mkdir(path.join(modules, '@loom-js'), { recursive: true });
    await mkdir(path.join(modules, '@tailwindcss'), { recursive: true });

    for (const name of ['build', 'core', 'devtools', 'pink']) {
        await symlink(
            path.join(workspaceRoot, 'packages', name),
            path.join(modules, '@loom-js', name),
            'dir'
        );
    }

    for (const name of LINKED_TOOLS) {
        await symlink(
            await realpath(path.join(createRoot, 'node_modules', name)),
            path.join(modules, name),
            'dir'
        );
    }
};

/** Every combination of the fixed choices and the registered kits. */
export const combinations = () => {
    const combos = [];

    for (const layout of ['single', 'monorepo']) {
        for (const spa of [false, true]) {
            for (const ui of [
                'none',
                ...REGISTRIES.uiKits.map(({ id }) => id)
            ]) {
                for (const tailwind of [false, true]) {
                    for (const js of [false, true]) {
                        combos.push({ js, layout, spa, tailwind, ui });
                    }
                }
            }
        }
    }

    return combos;
};

export const nameOf = ({ js, layout, spa, tailwind, ui }) =>
    [
        layout,
        spa ? 'spa' : 'ssr',
        ui,
        tailwind ? 'tw' : 'css',
        js ? 'js' : 'ts'
    ].join('-');

export const argvOf = (combo, formatter) => [
    nameOf(combo),
    '--layout',
    combo.layout,
    ...(combo.spa ? ['--spa'] : []),
    '--ui',
    combo.ui,
    ...(combo.tailwind ? ['--tailwind'] : []),
    ...(combo.js ? ['--js'] : []),
    '--formatter',
    formatter,
    '--git',
    'none',
    '--no-install'
];

export const appDirectoryOf = (root, combo) =>
    path.join(
        root,
        nameOf(combo),
        ...(combo.layout === 'monorepo' ? ['apps', 'web'] : [])
    );
