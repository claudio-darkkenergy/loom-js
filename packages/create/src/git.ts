// The git step: a new repository with one commit, a clone scaffolded on top,
// or nothing. Never pushes.
import type { Io, Spawn } from './io';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

/** Files a fresh hosted repository carries that the scaffold keeps. */
export const KEPT_FROM_CLONE = ['README.md', 'LICENSE', '.gitignore'];

export const NEW_COMMIT_MESSAGE = 'Initial commit from @loom-js/create';
export const CLONE_COMMIT_MESSAGE = 'Add a loom app from @loom-js/create';

const exists = (filePath: string) =>
    access(filePath).then(
        () => true,
        () => false
    );

/** Whether a `git` binary runs. */
export const hasGit = async (spawn: Spawn, cwd: string) =>
    (await spawn('git', ['--version'], { cwd })).code === 0;

/** Planned paths the clone already has, other than the kept files. */
export const cloneConflicts = async (
    directory: string,
    planned: readonly string[]
) => {
    const conflicts: string[] = [];

    for (const filePath of planned) {
        if (
            !KEPT_FROM_CLONE.includes(filePath) &&
            (await exists(path.join(directory, filePath)))
        ) {
            conflicts.push(filePath);
        }
    }

    return conflicts;
};

/** The clone's `.gitignore` plus any of ours it lacks. */
export const mergeGitignore = (existing: string, ours: string) => {
    const present = new Set(existing.split('\n').map((line) => line.trim()));
    const missing = ours
        .split('\n')
        .filter((line) => line.trim() && !present.has(line.trim()));

    if (missing.length === 0) {
        return existing;
    }

    const base = existing.endsWith('\n') ? existing : `${existing}\n`;

    return `${base}${missing.join('\n')}\n`;
};

/** Reads a kept file from the clone, or `undefined` when it has none. */
export const readCloned = (directory: string, filePath: string) =>
    readFile(path.join(directory, filePath), 'utf8').catch(() => undefined);

/** Stages everything and commits, unless git has no identity to commit as. */
export const commitAll = async (
    directory: string,
    message: string,
    spawn: Spawn,
    io: Io
) => {
    const identity = await spawn('git', ['config', 'user.email'], {
        cwd: directory
    });

    if (identity.code !== 0 || !identity.stdout.trim()) {
        io.print(
            [
                'git has no identity, so nothing was committed. To finish:',
                '  git config --global user.name "Your Name"',
                '  git config --global user.email you@example.com',
                `  git add -A && git commit -m "${message}"`
            ].join('\n')
        );

        return false;
    }

    const add = await spawn('git', ['add', '-A'], { cwd: directory });
    const commit =
        add.code === 0
            ? await spawn('git', ['commit', '-q', '-m', message], {
                  cwd: directory
              })
            : add;

    if (commit.code !== 0) {
        io.error(`git commit failed:\n${commit.stderr.trim()}`);

        return false;
    }

    return true;
};
