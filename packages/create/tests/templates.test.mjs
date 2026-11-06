// The template build: type erasure for the JS tree, its failure on
// non-erasable syntax, and the Tailwind layer's `dev` runner.
import { after, before, describe, it } from 'node:test';

import { buildTemplates, eraseTypes } from '../scripts/templates.mjs';
import { createRoot, tempRoot } from './support.mjs';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { REGISTRIES } = await import('../dist/index.mjs');
const { runTogether } =
    await import('../dist/templates/biome/ts/tailwind/scripts/dev.mjs');

let root;

before(async () => {
    root = await tempRoot('templates');
});
after(() => rm(root, { force: true, recursive: true }));

describe('type erasure', () => {
    it('drops types and the comment that documents erased syntax', () => {
        const source = [
            '// Explains the alias below.',
            'type Id = string;',
            '',
            '// Kept: documents a runtime line.',
            'export const id = (value: Id): Id => value;',
            ''
        ].join('\n');
        const erased = eraseTypes(source);

        assert.ok(!erased.includes('Explains'));
        assert.ok(erased.includes('// Kept'));
        assert.match(erased, /export const id = \(value\s*\)\s*=> value;/);
    });

    it('fails the build on syntax that needs a transform', async () => {
        const source = path.join(root, 'enum-layers');

        await mkdir(path.join(source, 'base/src'), { recursive: true });
        await writeFile(
            path.join(source, 'base/src/mode.ts'),
            "export enum Mode {\n    Dev = 'dev'\n}\n"
        );

        await assert.rejects(
            buildTemplates({
                binDirectory: path.join(createRoot, 'node_modules/.bin'),
                formatters: REGISTRIES.formatters,
                outDirectory: path.join(root, 'enum-out'),
                sourceDirectory: source
            }),
            { code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' }
        );
    });
});

describe('tailwind dev runner', () => {
    const fakeStart = () => {
        const children = [];
        const start = (command, args) => {
            const child = Object.assign(new EventEmitter(), {
                args,
                command,
                exitCode: null,
                killed: false,
                kill() {
                    this.killed = true;
                    this.exitCode = 143;
                    this.emit('exit', null);
                }
            });

            children.push(child);

            return child;
        };

        return { children, start };
    };

    it('starts both tasks and stops the survivor when one exits', async () => {
        const { children, start } = fakeStart();
        const done = runTogether(
            [
                ['tailwindcss', ['--watch']],
                ['loom', ['dev']]
            ],
            start
        );

        assert.deepEqual(
            children.map(({ command }) => command),
            ['tailwindcss', 'loom']
        );

        children[1].exitCode = 2;
        children[1].emit('exit', 2);

        assert.equal(await done, 2);
        assert.equal(children[0].killed, true);
    });

    it('stops the other task when one cannot start', async () => {
        const { children, start } = fakeStart();
        const done = runTogether(
            [
                ['tailwindcss', ['--watch=always']],
                ['loom', ['dev']]
            ],
            start
        );

        children[0].emit('error', new Error('spawn tailwindcss ENOENT'));

        assert.equal(await done, 1);
        assert.equal(children[1].killed, true);
    });
});
