// The CLI flow after the plan: install with the invoking package manager,
// then the git step against real git and a local bare-repository fixture.
import { after, before, describe, it } from 'node:test';

import { recordingSpawn } from './helpers.mjs';
import { scaffold, tempRoot } from './support.mjs';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const { mergeGitignore, nodeSpawn } = await import('../dist/index.mjs');

const exec = promisify(execFile);
const git = (cwd, ...args) => exec('git', args, { cwd });
const exists = (filePath) =>
    access(filePath).then(
        () => true,
        () => false
    );
const PNPM_AGENT = { npm_config_user_agent: 'pnpm/10.5.0 npm/? node/v24' };

let root;
let gitConfig;
const savedEnv = {};

// Real-git cases read identity from a throwaway global config only.
const useGitConfig = async (content) => {
    await writeFile(gitConfig, content);
};

before(async () => {
    root = await tempRoot('flow');
    gitConfig = path.join(root, 'gitconfig');

    for (const name of ['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM']) {
        savedEnv[name] = process.env[name];
    }

    process.env.GIT_CONFIG_GLOBAL = gitConfig;
    process.env.GIT_CONFIG_NOSYSTEM = '1';
    await useGitConfig(
        '[user]\n\tname = Test\n\temail = test@example.com\n[init]\n\tdefaultBranch = main\n'
    );
});

after(async () => {
    for (const [name, value] of Object.entries(savedEnv)) {
        if (value === undefined) {
            delete process.env[name];
        } else {
            process.env[name] = value;
        }
    }

    await rm(root, { force: true, recursive: true });
});

const fresh = async (name) => {
    const cwd = path.join(root, name);

    await mkdir(cwd, { recursive: true });

    return cwd;
};

// A bare repository holding `files`, as a hosted repo would be.
const bareRepository = async (name, files) => {
    const remote = path.join(root, `${name}.git`);
    const work = path.join(root, `${name}-seed`);

    await git(root, 'init', '-q', '--bare', remote);
    await git(root, 'clone', '-q', remote, work);

    for (const [file, content] of Object.entries(files)) {
        await writeFile(path.join(work, file), content);
    }

    await git(work, 'add', '-A');
    await git(work, 'commit', '-q', '-m', 'seed');
    await git(work, 'push', '-q', 'origin', 'HEAD');

    return remote;
};

describe('install', () => {
    it('installs with the invoking manager and names its commands', async () => {
        const cwd = await fresh('install');
        const { calls, spawn } = recordingSpawn();
        const { code, io } = await scaffold(
            cwd,
            ['my-app', '--yes', '--git', 'none'],
            PNPM_AGENT,
            spawn
        );

        assert.equal(code, 0);
        assert.deepEqual(
            calls.map(({ args, command, options }) => [
                command,
                args,
                options.cwd,
                options.inherit
            ]),
            [['pnpm', ['install'], path.join(cwd, 'my-app'), true]]
        );
        assert.match(io.printed.at(-1), /cd my-app\n {2}pnpm dev$/);
    });

    it('keeps the files, skips git and prints the command when install fails', async () => {
        const cwd = await fresh('install-fails');
        const { calls, spawn } = recordingSpawn((command) => ({
            code: command === 'pnpm' ? 1 : 0
        }));
        const { code, io } = await scaffold(
            cwd,
            ['my-app', '--yes'],
            PNPM_AGENT,
            spawn
        );

        assert.equal(code, 1);
        assert.ok(await exists(path.join(cwd, 'my-app/package.json')));
        assert.ok(!calls.some(({ command }) => command === 'git'));
        assert.match(io.errors.join('\n'), /pnpm install/);
    });
});

describe('git: new', () => {
    it('makes exactly one commit and leaves a clean tree', async () => {
        const cwd = await fresh('git-new');
        const { code } = await scaffold(
            cwd,
            ['my-app', '--yes', '--no-install'],
            undefined,
            nodeSpawn
        );
        const app = path.join(cwd, 'my-app');

        assert.equal(code, 0);
        assert.equal(
            (await git(app, 'rev-list', '--count', 'HEAD')).stdout.trim(),
            '1'
        );
        assert.equal((await git(app, 'status', '--porcelain')).stdout, '');
    });

    it('inits without committing when git has no identity', async () => {
        const cwd = await fresh('git-anonymous');

        await useGitConfig('');

        try {
            const { code, io } = await scaffold(
                cwd,
                ['my-app', '--yes', '--no-install'],
                undefined,
                nodeSpawn
            );
            const app = path.join(cwd, 'my-app');

            assert.equal(code, 0);
            assert.ok(await exists(path.join(app, '.git')));
            await assert.rejects(git(app, 'rev-parse', 'HEAD'));
            assert.match(
                io.printed.join('\n'),
                /git config --global user\.email/
            );
        } finally {
            await useGitConfig(
                '[user]\n\tname = Test\n\temail = test@example.com\n[init]\n\tdefaultBranch = main\n'
            );
        }
    });

    it('skips the step when git is not installed', async () => {
        const cwd = await fresh('git-missing');
        const { calls, spawn } = recordingSpawn((command) =>
            command === 'git' ? { code: null } : { code: 0 }
        );
        const { code, io } = await scaffold(
            cwd,
            ['my-app', '--yes', '--no-install'],
            undefined,
            spawn
        );

        assert.equal(code, 0);
        assert.deepEqual(
            calls.map(({ args }) => args),
            [['--version']]
        );
        assert.match(io.printed.join('\n'), /git is not installed/);
    });

    it('runs no git command with --git none', async () => {
        const cwd = await fresh('git-none');
        const { calls, spawn } = recordingSpawn();

        await scaffold(
            cwd,
            ['my-app', '--yes', '--no-install', '--git', 'none'],
            undefined,
            spawn
        );

        assert.deepEqual(calls, []);
        assert.ok(!(await exists(path.join(cwd, 'my-app/.git'))));
    });
});

describe('git: clone', () => {
    it("keeps a fresh repo's README and LICENSE, commits on top, never pushes", async () => {
        const remote = await bareRepository('fresh', {
            LICENSE: 'MIT\n',
            'README.md': '# Mine\n'
        });
        const cwd = await fresh('clone-fresh');
        const { code, io } = await scaffold(
            cwd,
            ['my-app', '--yes', '--no-install', '--git', remote],
            undefined,
            nodeSpawn
        );
        const app = path.join(cwd, 'my-app');

        assert.equal(code, 0, io.errors.join('\n'));
        assert.equal(
            await readFile(path.join(app, 'README.md'), 'utf8'),
            '# Mine\n'
        );
        assert.equal(
            await readFile(path.join(app, 'LICENSE'), 'utf8'),
            'MIT\n'
        );
        assert.ok(await exists(path.join(app, 'loom.config.ts')));
        assert.equal(
            (await git(app, 'rev-list', '--count', 'HEAD')).stdout.trim(),
            '2'
        );
        assert.equal(
            (await git(remote, 'rev-list', '--count', '--all')).stdout.trim(),
            '1'
        );
        assert.match(io.printed.at(-1), /git push$/);
    });

    it('aborts on a conflicting file and removes the clone', async () => {
        const remote = await bareRepository('conflict', {
            'package.json': '{}\n'
        });
        const cwd = await fresh('clone-conflict');
        const { code, io } = await scaffold(
            cwd,
            ['my-app', '--yes', '--no-install', '--git', remote],
            undefined,
            nodeSpawn
        );

        assert.equal(code, 1);
        assert.match(io.errors.join('\n'), /already has package\.json/);
        assert.ok(!(await exists(path.join(cwd, 'my-app'))));
    });

    it('writes nothing when the clone fails', async () => {
        const cwd = await fresh('clone-fails');
        const { code, io } = await scaffold(
            cwd,
            [
                'my-app',
                '--yes',
                '--no-install',
                '--git',
                path.join(root, 'missing.git')
            ],
            undefined,
            nodeSpawn
        );

        assert.equal(code, 1);
        assert.ok(io.errors.length > 0);
        assert.ok(!(await exists(path.join(cwd, 'my-app'))));
    });

    it("merges the scaffold's ignore lines into the clone's .gitignore", () => {
        assert.equal(
            mergeGitignore('node_modules\ndist\n', 'node_modules\nbuild\n'),
            'node_modules\ndist\nbuild\n'
        );
        assert.equal(mergeGitignore('build', 'build\n'), 'build');
    });
});
