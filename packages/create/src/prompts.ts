// Fills the choices no flag answered: prompts in a terminal, defaults under
// `--yes` or a non-TTY run. Only unanswered choices are asked.
import type { ParsedArgs } from './args';
import {
    type Choices,
    DEFAULT_TARGET,
    DEFAULTS,
    type GitChoice,
    NONE
} from './choices';
import type { Io } from './io';
import type { Registries, RegistryEntry } from './registry';

interface Option<Value> {
    label: string;
    value: Value;
}

const askText = async (io: Io, question: string, fallback: string) =>
    (await io.ask(`${question} (${fallback}) `)).trim() || fallback;

const askConfirm = async (io: Io, question: string, fallback: boolean) => {
    for (;;) {
        const answer = (
            await io.ask(`${question} (${fallback ? 'Y/n' : 'y/N'}) `)
        )
            .trim()
            .toLowerCase();

        if (!answer) {
            return fallback;
        }

        if (answer === 'y' || answer === 'yes') {
            return true;
        }

        if (answer === 'n' || answer === 'no') {
            return false;
        }
    }
};

const askChoice = async <Value>(
    io: Io,
    question: string,
    options: readonly Option<Value>[],
    fallback: Value
) => {
    const fallbackIndex = Math.max(
        0,
        options.findIndex(({ value }) => value === fallback)
    );
    const list = options
        .map(({ label }, index) => `  ${index + 1}) ${label}`)
        .join('\n');

    for (;;) {
        const answer = (
            await io.ask(`${question}\n${list}\n(${fallbackIndex + 1}) `)
        ).trim();
        const index = answer ? Number(answer) - 1 : fallbackIndex;
        const option = options[index];

        if (option) {
            return option.value;
        }
    }
};

const entryOptions = (
    entries: readonly RegistryEntry[],
    withNone: boolean
): Option<string>[] => [
    ...(withNone ? [{ label: 'None', value: NONE }] : []),
    ...entries.map(({ id, label }) => ({ label, value: id }))
];

const askGit = async (io: Io): Promise<GitChoice> => {
    const kind = await askChoice(
        io,
        'Git repository?',
        [
            { label: 'New repository with an initial commit', value: 'new' },
            { label: 'Clone an existing repository', value: 'clone' },
            { label: 'None', value: NONE }
        ] as const,
        'new'
    );

    if (kind !== 'clone') {
        return { kind };
    }

    for (;;) {
        const url = (await io.ask('Repository URL to clone: ')).trim();

        if (url) {
            return { kind: 'clone', url };
        }
    }
};

/** Every choice, from the flags first, then prompts or defaults. */
export const resolveChoices = async (
    { answers, yes }: ParsedArgs,
    io: Io,
    registries: Registries
): Promise<Choices> => {
    const ask = io.interactive && !yes;
    const defaultTaskRunner = registries.taskRunners[0]?.id;
    const target =
        answers.target ??
        (ask
            ? await askText(io, 'Project directory?', DEFAULT_TARGET)
            : DEFAULT_TARGET);
    const layout =
        answers.layout ??
        (ask
            ? await askChoice(
                  io,
                  'Layout?',
                  [
                      { label: 'Single app', value: 'single' },
                      { label: 'Monorepo (app at apps/web)', value: 'monorepo' }
                  ] as const,
                  DEFAULTS.layout
              )
            : DEFAULTS.layout);
    const taskRunner =
        layout !== 'monorepo'
            ? undefined
            : (answers.taskRunner ??
              // A one-entry registry has nothing to ask.
              (ask && defaultTaskRunner && registries.taskRunners.length > 1
                  ? await askChoice(
                        io,
                        'Task runner?',
                        entryOptions(registries.taskRunners, false),
                        defaultTaskRunner
                    )
                  : defaultTaskRunner));
    const spa =
        answers.spa ??
        (ask
            ? await askChoice(
                  io,
                  'Rendering?',
                  [
                      {
                          label: 'Server-first (prerender + hydrate)',
                          value: false
                      },
                      { label: 'Client-only (SPA)', value: true }
                  ] as const,
                  DEFAULTS.spa
              )
            : DEFAULTS.spa);
    const ui =
        answers.ui ??
        (ask
            ? await askChoice(
                  io,
                  'UI kit?',
                  entryOptions(registries.uiKits, true),
                  DEFAULTS.ui
              )
            : DEFAULTS.ui);
    const tailwind =
        answers.tailwind ??
        (ask
            ? await askConfirm(io, 'Add Tailwind CSS?', DEFAULTS.tailwind)
            : DEFAULTS.tailwind);
    const formatter =
        answers.formatter ??
        (ask
            ? await askChoice(
                  io,
                  'Formatter?',
                  entryOptions(registries.formatters, true),
                  DEFAULTS.formatter
              )
            : DEFAULTS.formatter);
    const js =
        answers.js ??
        (ask
            ? await askChoice(
                  io,
                  'Language?',
                  [
                      { label: 'TypeScript', value: false },
                      { label: 'JavaScript', value: true }
                  ] as const,
                  DEFAULTS.js
              )
            : DEFAULTS.js);
    const git = answers.git ?? (ask ? await askGit(io) : DEFAULTS.git);
    const install =
        answers.install ??
        (ask
            ? await askConfirm(io, 'Install dependencies?', DEFAULTS.install)
            : DEFAULTS.install);

    return {
        formatter,
        git,
        install,
        js,
        layout,
        spa,
        tailwind,
        target,
        taskRunner,
        ui
    };
};
