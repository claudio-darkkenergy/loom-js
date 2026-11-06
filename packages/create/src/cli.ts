// The `create` command, end to end: choices → plan → write → install → git.
// Every edge (terminal, processes) comes in through `io` and `spawn`.
import { parseCliArgs, UsageError } from './args';
import { type Choices, NONE } from './choices';
import {
    CLONE_COMMIT_MESSAGE,
    cloneConflicts,
    commitAll,
    hasGit,
    KEPT_FROM_CLONE,
    mergeGitignore,
    NEW_COMMIT_MESSAGE,
    readCloned
} from './git';
import type { Io, Spawn } from './io';
import { diskLayerReader } from './layers';
import {
    detectPackageManager,
    installCommand,
    type PackageManager,
    resolveVersion,
    runCommand
} from './package-manager';
import { resolveChoices } from './prompts';
import { entryOf, REGISTRIES, type Registries } from './registry';
import type { RenderContext } from './render/context';
import { planScaffold, writeScaffold } from './scaffold';
import { checkTarget, packageNameOf } from './target';
import { usage } from './usage';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface RunOptions {
    argv: readonly string[];
    cwd: string;
    env: Readonly<Record<string, string | undefined>>;
    io: Io;
    spawn: Spawn;
    registries?: Registries;
    /** Where the built template trees live. Default: next to the bundle. */
    templatesDirectory?: string;
}

const defaultTemplates = () =>
    fileURLToPath(new URL('./templates/', import.meta.url));

const contextOf = (
    choices: Choices,
    name: string,
    packageManager: PackageManager,
    registries: Registries
): RenderContext => ({
    choices,
    formatter:
        choices.formatter === NONE
            ? undefined
            : entryOf(registries.formatters, choices.formatter),
    name,
    packageManager,
    taskRunner: choices.taskRunner
        ? entryOf(registries.taskRunners, choices.taskRunner)
        : undefined,
    uiKit:
        choices.ui === NONE ? undefined : entryOf(registries.uiKits, choices.ui)
});

// The tree to copy from: `none` uses the default formatter's.
const treeOf = (choices: Choices, registries: Registries, root: string) =>
    path.join(
        root,
        choices.formatter === NONE
            ? (registries.formatters[0]?.id ?? '')
            : choices.formatter,
        choices.js ? 'js' : 'ts'
    );

// Undoes a clone the run made: the directory if the run created it.
const removeClone = async (directory: string, created: boolean) => {
    if (created) {
        await rm(directory, { force: true, recursive: true });

        return;
    }

    for (const entry of await readdir(directory)) {
        await rm(path.join(directory, entry), { force: true, recursive: true });
    }
};

const nextSteps = (
    choices: Choices,
    packageManager: PackageManager,
    installed: boolean
) => [
    'Next:',
    ...(choices.target === '.' ? [] : [`  cd ${choices.target}`]),
    ...(installed ? [] : [`  ${installCommand(packageManager).join(' ')}`]),
    `  ${runCommand(packageManager, 'dev')}`,
    ...(choices.git.kind === 'clone' ? ['  git push'] : [])
];

/** Runs the command; resolves with the exit code. */
export const run = async ({
    argv,
    cwd,
    env,
    io,
    registries = REGISTRIES,
    spawn,
    templatesDirectory = defaultTemplates()
}: RunOptions) => {
    try {
        const parsed = parseCliArgs(argv, registries);

        if (parsed.help) {
            io.print(usage(registries));

            return 0;
        }

        const choices = await resolveChoices(parsed, io, registries);
        const name = packageNameOf(choices.target, cwd);
        const directory = path.resolve(cwd, choices.target);
        const { exists } = await checkTarget(directory);
        const detected = detectPackageManager(env);
        const needsVersion =
            choices.layout === 'monorepo' || detected.name === 'yarn';
        const version = needsVersion
            ? await resolveVersion(detected, spawn, cwd)
            : detected.version;
        const packageManager = { ...detected, version };
        const context = contextOf(choices, name, packageManager, registries);
        const files = await planScaffold(
            context,
            diskLayerReader(treeOf(choices, registries, templatesDirectory)),
            {
                packageManagerField: version
                    ? `${packageManager.name}@${version}`
                    : undefined,
                packageManagerVersion: version
            }
        );

        if (choices.git.kind === 'clone') {
            const clone = await spawn(
                'git',
                ['clone', choices.git.url, directory],
                { cwd }
            );

            if (clone.code !== 0) {
                io.error(clone.stderr.trim() || 'git clone failed.');

                return 1;
            }

            const conflicts = await cloneConflicts(
                directory,
                Object.keys(files)
            );

            if (conflicts.length > 0) {
                await removeClone(directory, !exists);
                io.error(
                    `The repository already has ${conflicts.join(', ')}; nothing was written.`
                );

                return 1;
            }

            for (const kept of KEPT_FROM_CLONE) {
                const cloned = await readCloned(directory, kept);

                if (cloned === undefined) {
                    continue;
                }

                if (kept === '.gitignore' && files[kept] !== undefined) {
                    files[kept] = mergeGitignore(cloned, files[kept]);
                } else {
                    delete files[kept];
                }
            }
        }

        await mkdir(directory, { recursive: true });
        await writeScaffold(directory, files);
        io.print(`Created ${name} in ${directory}.`);

        if (choices.install) {
            const [command = 'npm', ...args] = installCommand(packageManager);
            const install = await spawn(command, args, {
                cwd: directory,
                inherit: true
            });

            if (install.code !== 0) {
                io.error(
                    `Install failed. The files are in place; run it yourself:\n  cd ${choices.target}\n  ${installCommand(packageManager).join(' ')}`
                );

                return 1;
            }
        }

        if (choices.git.kind !== 'none') {
            if (!(await hasGit(spawn, directory))) {
                io.print('git is not installed, so no repository was set up.');
            } else {
                if (choices.git.kind === 'new') {
                    await spawn('git', ['init', '-q'], { cwd: directory });
                }

                await commitAll(
                    directory,
                    choices.git.kind === 'new'
                        ? NEW_COMMIT_MESSAGE
                        : CLONE_COMMIT_MESSAGE,
                    spawn,
                    io
                );
            }
        }

        io.print(
            nextSteps(choices, packageManager, choices.install).join('\n')
        );

        return 0;
    } catch (error) {
        if (error instanceof UsageError) {
            io.error(`${usage(registries)}\n\n${error.message}`);

            return 1;
        }

        throw error;
    } finally {
        io.close();
    }
};
