// Turns argv into the choices the flags answer. Every rejection throws a
// `UsageError` before anything touches the disk.
import { type Choices, type GitChoice, type Layout, NONE } from './choices';
import { findEntry, type RegistryEntry, type Registries } from './registry';
import { parseArgs } from 'node:util';

export class UsageError extends Error {}

export interface ParsedArgs {
    help: boolean;
    yes: boolean;
    /** The choices a flag (or the positional) answered. */
    answers: Partial<Choices>;
}

const LAYOUTS: readonly Layout[] = ['single', 'monorepo'];

const OPTIONS = {
    formatter: { type: 'string' },
    git: { type: 'string' },
    help: { short: 'h', type: 'boolean' },
    install: { type: 'boolean' },
    js: { type: 'boolean' },
    layout: { type: 'string' },
    'no-install': { type: 'boolean' },
    spa: { type: 'boolean' },
    tailwind: { type: 'boolean' },
    'task-runner': { type: 'string' },
    ui: { type: 'string' },
    yes: { short: 'y', type: 'boolean' }
} as const;

const registryValue = (
    flag: string,
    value: string,
    entries: readonly RegistryEntry[],
    allowNone: boolean
) => {
    if ((allowNone && value === NONE) || findEntry(entries, value)) {
        return value;
    }

    const ids = [...(allowNone ? [NONE] : []), ...entries.map(({ id }) => id)];

    throw new UsageError(
        `--${flag} "${value}" is not one of: ${ids.join(', ')}.`
    );
};

// A clone source is anything git can clone: a URL, scp-style or a path.
const looksLikeRepository = (value: string) => /[:/\\]/.test(value);

const gitValue = (value: string): GitChoice => {
    if (value === 'new' || value === NONE) {
        return { kind: value };
    }

    if (looksLikeRepository(value)) {
        return { kind: 'clone', url: value };
    }

    throw new UsageError(
        `--git takes new, none or a repository URL, not "${value}".`
    );
};

const parse = (argv: readonly string[]) => {
    try {
        return parseArgs({
            allowPositionals: true,
            args: [...argv],
            options: OPTIONS,
            strict: true
        });
    } catch (error) {
        throw new UsageError(
            error instanceof Error ? error.message : String(error)
        );
    }
};

/** Parses and validates argv against the registries. */
export const parseCliArgs = (
    argv: readonly string[],
    registries: Registries
): ParsedArgs => {
    const { positionals, values } = parse(argv);
    const answers: Partial<Choices> = {};

    if (positionals.length > 1) {
        throw new UsageError(
            `expected one directory, got ${positionals.length}: ${positionals.join(' ')}.`
        );
    }

    if (positionals[0] !== undefined) {
        answers.target = positionals[0];
    }

    if (values.layout !== undefined) {
        if (!LAYOUTS.includes(values.layout as Layout)) {
            throw new UsageError(
                `--layout "${values.layout}" is not one of: ${LAYOUTS.join(', ')}.`
            );
        }

        answers.layout = values.layout as Layout;
    }

    if (values['task-runner'] !== undefined) {
        if (answers.layout === 'single') {
            throw new UsageError(
                '--task-runner applies only to --layout monorepo.'
            );
        }

        // A task runner implies the monorepo layout.
        answers.layout = 'monorepo';
        answers.taskRunner = registryValue(
            'task-runner',
            values['task-runner'],
            registries.taskRunners,
            false
        );
    }

    if (values.ui !== undefined) {
        answers.ui = registryValue('ui', values.ui, registries.uiKits, true);
    }

    if (values.formatter !== undefined) {
        answers.formatter = registryValue(
            'formatter',
            values.formatter,
            registries.formatters,
            true
        );
    }

    if (values.git !== undefined) {
        answers.git = gitValue(values.git);
    }

    if (values.install && values['no-install']) {
        throw new UsageError('--install and --no-install contradict.');
    }

    if (values.install || values['no-install']) {
        answers.install = Boolean(values.install);
    }

    if (values.spa) {
        answers.spa = true;
    }

    if (values.tailwind) {
        answers.tailwind = true;
    }

    if (values.js) {
        answers.js = true;
    }

    return {
        answers,
        help: Boolean(values.help),
        yes: Boolean(values.yes)
    };
};
