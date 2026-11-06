import { NONE } from './choices';
import type { RegistryEntry, Registries } from './registry';

const COLUMN = 38;

const idList = (entries: readonly RegistryEntry[], withNone: boolean) =>
    [...(withNone ? [NONE] : []), ...entries.map(({ id }) => id)].join('|');

const row = ([flag, description]: [string, string]) =>
    `  ${flag.padEnd(COLUMN - 3)} ${description}`;

/** The `--help` text, listing each registry's ids. */
export const usage = ({ formatters, taskRunners, uiKits }: Registries) => {
    const rows: [string, string][] = [
        ['--layout <single|monorepo>', 'App layout (default: single)'],
        [
            `--task-runner <${idList(taskRunners, false)}>`,
            `Monorepo task runner (default: ${taskRunners[0]?.id})`
        ],
        ['--spa', 'Client-only rendering (default: server-first)'],
        [`--ui <${idList(uiKits, true)}>`, `UI kit (default: ${NONE})`],
        ['--tailwind', 'Tailwind CSS v4'],
        [
            `--formatter <${idList(formatters, true)}>`,
            `Formatter (default: ${formatters[0]?.id})`
        ],
        ['--js', 'JavaScript instead of TypeScript'],
        [
            '--git <new|none|url>',
            'New repo, none, or clone a URL (default: new)'
        ],
        ['--install, --no-install', 'Install dependencies (default: install)'],
        ['-y, --yes', 'Accept the defaults for every unanswered choice'],
        ['-h, --help', 'Show this help']
    ];

    return `Usage: create @loom-js [directory] [options]

Run it through your package manager: npm create @loom-js, pnpm create
@loom-js, yarn create @loom-js or bun create @loom-js (or npx, pnpm dlx,
yarn dlx or bunx @loom-js/create). In a terminal, unanswered choices are
prompted for; otherwise they take their defaults.

Options:
${rows.map(row).join('\n')}`;
};
