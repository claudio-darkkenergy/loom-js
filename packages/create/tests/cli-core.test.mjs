// The CLI core over the built `dist/`: flags, registries, prompts, the
// target guard and package-manager detection.
import { describe, it } from 'node:test';

import { recordingSpawn, scriptedIo } from './helpers.mjs';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const {
    checkTarget,
    detectPackageManager,
    packageNameOf,
    parseCliArgs,
    REGISTRIES,
    resolveChoices,
    resolveVersion,
    runCommand,
    usage,
    UsageError
} = await import('../dist/index.mjs');

const parse = (...argv) => parseCliArgs(argv, REGISTRIES);

describe('registries', () => {
    it('lists every registry id in --help', () => {
        const text = usage(REGISTRIES);

        assert.match(text, /--ui <none\|pink>/);
        assert.match(text, /--task-runner <turbo>/);
        assert.match(text, /--formatter <none\|biome\|prettier>/);
        assert.match(text, /default: biome/);
    });

    it('surfaces a new entry in help and validation with no other edit', () => {
        const registries = {
            ...REGISTRIES,
            taskRunners: [
                ...REGISTRIES.taskRunners,
                { ...REGISTRIES.taskRunners[0], id: 'nx', label: 'Nx' }
            ],
            uiKits: [
                ...REGISTRIES.uiKits,
                { ...REGISTRIES.uiKits[0], id: 'other', label: 'Other kit' }
            ]
        };

        assert.match(usage(registries), /--ui <none\|pink\|other>/);
        assert.match(usage(registries), /--task-runner <turbo\|nx>/);
        assert.equal(
            parseCliArgs(['--ui', 'other'], registries).answers.ui,
            'other'
        );
        assert.equal(
            parseCliArgs(['--task-runner', 'nx'], registries).answers
                .taskRunner,
            'nx'
        );
    });
});

describe('flags', () => {
    it('reads every flag into an answer', () => {
        const { answers } = parse(
            'my-app',
            '--layout',
            'single',
            '--spa',
            '--ui',
            'pink',
            '--tailwind',
            '--formatter',
            'none',
            '--js',
            '--git',
            'none',
            '--no-install'
        );

        assert.deepEqual(answers, {
            formatter: 'none',
            git: { kind: 'none' },
            install: false,
            js: true,
            layout: 'single',
            spa: true,
            tailwind: true,
            target: 'my-app',
            ui: 'pink'
        });
    });

    it('reads --git as new, none or a clone URL', () => {
        assert.deepEqual(parse('--git', 'new').answers.git, { kind: 'new' });
        assert.deepEqual(
            parse('--git', 'git@github.com:me/app.git').answers.git,
            { kind: 'clone', url: 'git@github.com:me/app.git' }
        );
        assert.throws(() => parse('--git', 'maybe'), UsageError);
    });

    it('rejects an unknown flag', () => {
        assert.throws(() => parse('--tailwnd'), {
            message: /tailwnd/,
            name: 'Error'
        });
        assert.throws(() => parse('--tailwnd'), UsageError);
    });

    it('rejects an unregistered value, listing the registered ones', () => {
        assert.throws(() => parse('--ui', 'bootstrap'), {
            message: /"bootstrap" is not one of: none, pink/
        });
        assert.throws(() => parse('--formatter', 'dprint'), UsageError);
        assert.throws(() => parse('--layout', 'mono'), UsageError);
    });

    it('rejects a task runner with the single layout', () => {
        assert.throws(
            () => parse('--task-runner', 'turbo', '--layout', 'single'),
            {
                message: /applies only to --layout monorepo/
            }
        );
    });

    it('takes a task runner alone as the monorepo layout', () => {
        assert.equal(
            parse('--task-runner', 'turbo').answers.layout,
            'monorepo'
        );
    });

    it('rejects contradictions and extra positionals', () => {
        assert.throws(() => parse('--install', '--no-install'), UsageError);
        assert.throws(() => parse('one', 'two'), UsageError);
    });

    it('reads --help and --yes', () => {
        assert.equal(parse('-h').help, true);
        assert.equal(parse('-y').yes, true);
    });
});

describe('target', () => {
    it('normalizes the package name from the directory', () => {
        assert.equal(packageNameOf('./My App', '/tmp'), 'my-app');
        assert.equal(packageNameOf('.', '/work/Loom Site'), 'loom-site');
    });

    it('rejects an invalid package name', () => {
        assert.throws(() => packageNameOf('./_private', '/tmp'), {
            message: /"_private"/
        });
    });

    it('refuses a non-empty directory and accepts a .git-only one', async () => {
        const root = await mkdtemp(path.join(tmpdir(), 'create-target-'));
        const occupied = path.join(root, 'occupied');
        const checkout = path.join(root, 'checkout');

        await mkdir(occupied);
        await writeFile(path.join(occupied, 'index.html'), '');
        await mkdir(path.join(checkout, '.git'), { recursive: true });

        await assert.rejects(checkTarget(occupied), {
            message: /not empty \(index\.html\)/
        });
        assert.deepEqual(await checkTarget(checkout), { exists: true });
        assert.deepEqual(await checkTarget(path.join(root, 'new')), {
            exists: false
        });
    });
});

describe('choices', () => {
    const defaults = {
        formatter: 'biome',
        git: { kind: 'new' },
        install: true,
        js: false,
        layout: 'single',
        spa: false,
        tailwind: false,
        target: 'loom-app',
        taskRunner: undefined,
        ui: 'none'
    };

    it('takes every default under --yes', async () => {
        const io = scriptedIo({ interactive: true });

        assert.deepEqual(
            await resolveChoices(parse('--yes'), io, REGISTRIES),
            defaults
        );
        assert.equal(io.asked.length, 0);
    });

    it('never reads stdin in a non-TTY run', async () => {
        const io = scriptedIo({ interactive: false });

        assert.deepEqual(
            await resolveChoices(parse('loom-app'), io, REGISTRIES),
            defaults
        );
        assert.equal(io.asked.length, 0);
    });

    it('prompts only for unanswered choices', async () => {
        // target, layout, rendering, tailwind, formatter, language, git, install
        const io = scriptedIo({
            answers: ['site', '', '', 'y', '2', '', '3', 'n'],
            interactive: true
        });
        const choices = await resolveChoices(
            parse('--ui', 'pink'),
            io,
            REGISTRIES
        );

        assert.equal(io.asked.length, 8);
        assert.ok(!io.asked.some((question) => /UI kit/.test(question)));
        assert.ok(!io.asked.some((question) => /Task runner/.test(question)));
        assert.deepEqual(choices, {
            ...defaults,
            formatter: 'biome',
            git: { kind: 'none' },
            install: false,
            tailwind: true,
            target: 'site',
            ui: 'pink'
        });
    });

    it('asks for the task runner only once monorepo is picked', async () => {
        const registries = {
            ...REGISTRIES,
            taskRunners: [
                ...REGISTRIES.taskRunners,
                { ...REGISTRIES.taskRunners[0], id: 'nx', label: 'Nx' }
            ]
        };
        const flags = ['app', '--spa', '--ui', 'none', '--tailwind'];
        const rest = [
            '--formatter',
            'biome',
            '--js',
            '--git',
            'none',
            '--install'
        ];
        const single = scriptedIo({ answers: ['1'], interactive: true });
        const monorepo = scriptedIo({ answers: ['2', '2'], interactive: true });

        await resolveChoices(
            parseCliArgs([...flags, ...rest], registries),
            single,
            registries
        );
        const choices = await resolveChoices(
            parseCliArgs([...flags, ...rest], registries),
            monorepo,
            registries
        );

        assert.ok(
            !single.asked.some((question) => /Task runner/.test(question))
        );
        assert.ok(
            monorepo.asked.some((question) => /Task runner/.test(question))
        );
        assert.equal(choices.taskRunner, 'nx');
    });

    it('skips the task-runner prompt when one is registered', async () => {
        const io = scriptedIo({ answers: ['2'], interactive: true });
        const choices = await resolveChoices(
            parse(
                'app',
                '--spa',
                '--ui',
                'none',
                '--tailwind',
                '--formatter',
                'biome',
                '--js',
                '--git',
                'none',
                '--install'
            ),
            io,
            REGISTRIES
        );

        assert.equal(io.asked.length, 1);
        assert.equal(choices.taskRunner, 'turbo');
    });

    it('re-asks an out-of-range choice', async () => {
        const io = scriptedIo({
            answers: ['9', '2'],
            interactive: true
        });
        const choices = await resolveChoices(
            parse(
                'app',
                '--spa',
                '--ui',
                'none',
                '--tailwind',
                '--formatter',
                'biome',
                '--js',
                '--git',
                'none',
                '--install'
            ),
            io,
            REGISTRIES
        );

        assert.equal(io.asked.length, 2);
        assert.equal(choices.layout, 'monorepo');
    });
});

describe('package manager', () => {
    it('reads the invoking manager and version from the user agent', () => {
        const agent = (value) =>
            detectPackageManager({ npm_config_user_agent: value });

        assert.deepEqual(
            agent('pnpm/9.12.0 npm/? node/v24.14.0 darwin arm64'),
            {
                name: 'pnpm',
                version: '9.12.0'
            }
        );
        assert.equal(agent('yarn/1.22.22 npm/? node/v24').name, 'yarn');
        assert.equal(agent('bun/1.2.0 npm/? node/v24').name, 'bun');
        assert.equal(agent('npm/11.5.1 node/v24').name, 'npm');
        assert.deepEqual(detectPackageManager({}), { name: 'npm' });
    });

    it('names the run command per manager', () => {
        assert.equal(runCommand({ name: 'npm' }, 'dev'), 'npm run dev');
        assert.equal(runCommand({ name: 'pnpm' }, 'dev'), 'pnpm dev');
        assert.equal(runCommand({ name: 'yarn' }, 'dev'), 'yarn dev');
        assert.equal(runCommand({ name: 'bun' }, 'dev'), 'bun run dev');
    });

    it('asks the binary for a version the agent did not give', async () => {
        const { calls, spawn } = recordingSpawn(() => ({
            code: 0,
            stdout: '10.9.0\n'
        }));

        assert.equal(
            await resolveVersion({ name: 'npm' }, spawn, '/tmp'),
            '10.9.0'
        );
        assert.deepEqual(calls[0].args, ['--version']);
        assert.equal(
            await resolveVersion(
                { name: 'pnpm', version: '9.1.0' },
                spawn,
                '/tmp'
            ),
            '9.1.0'
        );
    });
});
