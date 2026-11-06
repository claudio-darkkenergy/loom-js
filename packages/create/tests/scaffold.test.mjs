// The scaffold's file set: rendered-file snapshots per combination and per
// package manager, the layer rules, layout parity, the leakage sweep and the
// formatter entries. Run via `pnpm test-ci`.
import { after, before, describe, it } from 'node:test';

import {
    argvOf,
    binOf,
    combinations,
    nameOf,
    readTree,
    scaffold,
    tempRoot,
    workspaceRoot
} from './support.mjs';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';

const { layerNamesFor, mergeLayers, REGISTRIES } =
    await import('../dist/index.mjs');

const exec = promisify(execFile);

// Files the renderers write (everything else comes from template layers).
const RENDERED =
    /(^|\/)(package\.json|loom\.config\.(ts|mjs)|src\/bootstrap\.(ts|js)|src\/styles\.css|[tj]sconfig(\.base)?\.json|README\.md|\.gitignore|\.yarnrc\.yml|pnpm-workspace\.yaml|turbo\.json|biome\.json|\.prettierrc|\.prettierignore)$/;

// Stamped ranges move with every release; the snapshots pin the shape only.
const withoutRanges = (content) =>
    content.replace(/("[@\w./-]+": )"\^[\w.-]+"/g, '$1"<range>"');

const renderedOnly = (files) =>
    Object.fromEntries(
        Object.entries(files)
            .filter(([file]) => RENDERED.test(file))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([file, content]) => [file, withoutRanges(content)])
    );

let root;
const trees = new Map();

const treeOf = async (combo, formatter = 'biome', env) => {
    const key = `${formatter}:${nameOf(combo)}:${env?.npm_config_user_agent ?? ''}`;

    if (!trees.has(key)) {
        const cwd = path.join(root, String(trees.size));

        await mkdir(cwd, { recursive: true });

        // One target name for every tree, so layouts compare like for like.
        const [, ...flags] = argvOf(combo, formatter);
        const { code, io } = await scaffold(cwd, ['app', ...flags], env);

        assert.equal(code, 0, io.errors.join('\n'));
        trees.set(key, await readTree(path.join(cwd, 'app')));
    }

    return trees.get(key);
};

before(async () => {
    root = await tempRoot('scaffold');
});
after(() => rm(root, { force: true, recursive: true }));

describe('rendered files', () => {
    for (const combo of combinations()) {
        it(`snapshot: ${nameOf(combo)}`, async (t) => {
            t.assert.snapshot(renderedOnly(await treeOf(combo)));
        });
    }

    it('writes rendered sources with no type syntax', async () => {
        for (const combo of combinations()) {
            const files = await treeOf(combo);

            for (const [file, content] of Object.entries(files)) {
                if (/(loom\.config\.(ts|mjs)|bootstrap\.(ts|js))$/.test(file)) {
                    assert.equal(
                        stripTypeScriptTypes(content, { mode: 'strip' }),
                        content,
                        `${nameOf(combo)}/${file} has type syntax`
                    );
                }
            }
        }
    });

    for (const agent of [
        'npm/11.5.1 node/v24.14.0',
        'pnpm/10.5.0 npm/? node/v24.14.0',
        'yarn/4.6.0 npm/? node/v24.14.0',
        'bun/1.2.5 npm/? node/v24.14.0'
    ]) {
        it(`snapshot: monorepo root under ${agent.split('/')[0]}`, async (t) => {
            const combo = {
                js: false,
                layout: 'monorepo',
                spa: false,
                tailwind: false,
                ui: 'none'
            };
            const files = await treeOf(combo, 'biome', {
                npm_config_user_agent: agent
            });

            t.assert.snapshot(
                renderedOnly(
                    Object.fromEntries(
                        Object.entries(files).filter(
                            ([file]) => !file.startsWith('apps/')
                        )
                    )
                )
            );
        });
    }
});

describe('layers', () => {
    it('copies base, server, the kit, then tailwind', () => {
        assert.deepEqual(
            layerNamesFor({ spa: false, tailwind: true, ui: 'pink' }),
            ['base', 'server', 'ui/pink', 'tailwind']
        );
        assert.deepEqual(
            layerNamesFor({ spa: true, tailwind: false, ui: 'none' }),
            ['base']
        );
    });

    it('lets one layer override base', () => {
        assert.deepEqual(
            mergeLayers([
                { files: { 'a.ts': 'base' }, name: 'base' },
                { files: { 'a.ts': 'kit' }, name: 'ui/pink' }
            ]),
            { 'a.ts': 'kit' }
        );
    });

    it('rejects two non-base layers writing one path', () => {
        assert.throws(
            () =>
                mergeLayers([
                    { files: { 'src/app.ts': 'base' }, name: 'base' },
                    { files: { 'src/app.ts': 'kit' }, name: 'ui/pink' },
                    { files: { 'src/app.ts': 'tw' }, name: 'tailwind' }
                ]),
            { message: /"ui\/pink" and "tailwind" both write src\/app\.ts/ }
        );
    });
});

describe('layout parity', () => {
    const ROOT_OWNED = new Set([
        '.gitignore',
        'README.md',
        '.yarnrc.yml',
        'pnpm-workspace.yaml',
        ...REGISTRIES.formatters.flatMap((formatter) =>
            Object.keys(formatter.files({ ignored: [] }))
        )
    ]);

    for (const combo of combinations().filter(
        ({ layout }) => layout === 'single'
    )) {
        it(nameOf(combo), async () => {
            const single = await treeOf(combo);
            const monorepo = await treeOf({ ...combo, layout: 'monorepo' });
            const app = Object.fromEntries(
                Object.entries(monorepo)
                    .filter(([file]) => file.startsWith('apps/web/'))
                    .map(([file, content]) => [
                        file.slice('apps/web/'.length),
                        content
                    ])
            );
            const singleApp = Object.fromEntries(
                Object.entries(single).filter(([file]) => !ROOT_OWNED.has(file))
            );
            const singlePackage = JSON.parse(singleApp['package.json']);
            const monorepoPackage = JSON.parse(app['package.json']);

            for (const script of ['format', 'format:check']) {
                delete singlePackage.scripts[script];
            }

            for (const formatter of REGISTRIES.formatters) {
                for (const dependency of formatter.devDependencies) {
                    delete singlePackage.devDependencies[dependency];
                }
            }

            delete singlePackage.name;
            delete monorepoPackage.name;
            assert.deepEqual(monorepoPackage, singlePackage);

            for (const file of Object.keys(singleApp)) {
                if (file !== 'package.json' && file !== 'tsconfig.json') {
                    assert.equal(app[file], singleApp[file], `${file} differs`);
                }
            }

            assert.deepEqual(
                Object.keys(app).sort(),
                Object.keys(singleApp).sort()
            );
        });
    }
});

describe('leakage', () => {
    it('references nothing outside the target, in any combination', async () => {
        for (const formatter of [
            ...REGISTRIES.formatters.map(({ id }) => id),
            'none'
        ]) {
            for (const combo of combinations()) {
                const files = await treeOf(combo, formatter);
                const label = `${formatter}/${nameOf(combo)}`;

                for (const [file, content] of Object.entries(files)) {
                    assert.ok(
                        !content.includes('workspace:'),
                        `${label}/${file}`
                    );
                    assert.ok(
                        !content.includes('@loom-js/typescript-config'),
                        `${label}/${file}`
                    );
                    assert.ok(
                        !content.includes(workspaceRoot),
                        `${label}/${file}`
                    );
                    assert.ok(!content.includes(root), `${label}/${file}`);

                    if (combo.ui === 'none') {
                        assert.ok(!/pink/i.test(content), `${label}/${file}`);
                    }

                    if (formatter === 'none') {
                        assert.ok(
                            !/biome|prettier/i.test(content),
                            `${label}/${file}`
                        );
                    }
                }

                if (combo.js) {
                    assert.deepEqual(
                        Object.keys(files).filter((file) =>
                            file.endsWith('.ts')
                        ),
                        [],
                        label
                    );
                }
            }
        }
    });
});

describe('formatters', () => {
    const combo = {
        js: false,
        layout: 'single',
        spa: false,
        tailwind: false,
        ui: 'none'
    };

    it('installs nothing but the tool itself', async () => {
        for (const formatter of REGISTRIES.formatters) {
            const files = await treeOf(combo, formatter.id);
            const { devDependencies } = JSON.parse(files['package.json']);
            const tools = Object.keys(devDependencies).filter((name) =>
                /biome|prettier/.test(name)
            );

            assert.deepEqual(tools, [...formatter.devDependencies]);
        }

        const prettierrc = JSON.parse(
            (await treeOf(combo, 'prettier'))['.prettierrc']
        );

        assert.equal(prettierrc.plugins, undefined);
    });

    it('restores house import order with Biome', async () => {
        const cwd = path.join(root, 'shuffled');

        await mkdir(cwd, { recursive: true });
        await scaffold(cwd, argvOf(combo, 'biome'));

        const app = path.join(cwd, nameOf(combo));
        const prerender = path.join(app, 'src/prerender.entry.ts');
        const source = await readFile(prerender, 'utf8');
        const shuffled = source.replace(
            /(import \{\n[\s\S]*?\} from '@loom-js\/core\/server';\n)\n(import \{ App \} from '\.\/app';\n)/,
            '$2$1'
        );

        assert.notEqual(shuffled, source);
        await writeFile(prerender, shuffled);
        await exec(binOf('biome'), ['check', '--write'], { cwd: app });
        assert.equal(await readFile(prerender, 'utf8'), source);
    });
});
