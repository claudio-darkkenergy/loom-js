// Files the repository root owns: `.gitignore`, the README, and the yarn
// linker setting. In a monorepo they sit above `apps/web`.
import { runCommand } from '../package-manager';
import { appScripts, type RenderContext } from './context';

const SCRIPT_PURPOSE: Record<string, (context: RenderContext) => string> = {
    build: ({ choices }) =>
        choices.spa
            ? 'build the app into `build/`.'
            : 'build the app into `build/`, prerendering every route.',
    dev: () => 'start the dev server, reloading on every change.',
    format: ({ formatter }) => `format every file with ${formatter?.label}.`,
    'format:check': () => 'fail on any unformatted file.',
    'type-check': () => 'type-check with `tsc`.'
};

/** `.gitignore`: dependencies, build output, and what the choices generate. */
export const renderGitignore = ({ choices, taskRunner }: RenderContext) =>
    `${[
        'node_modules',
        'build',
        '.DS_Store',
        '*.log',
        ...(choices.tailwind ? ['.generated'] : []),
        ...(choices.layout === 'monorepo' ? (taskRunner?.gitignore ?? []) : [])
    ].join('\n')}\n`;

/** The README: what was created and the scripts to run. */
export const renderReadme = (context: RenderContext) => {
    const { choices, formatter, name, packageManager } = context;
    const scripts = [
        ...appScripts(context),
        ...(formatter ? ['format', 'format:check'] : [])
    ];
    const where =
        choices.layout === 'monorepo'
            ? 'A monorepo with a [loom](https://loom-js-docs.vercel.app/docs) app in `apps/web`'
            : 'A [loom](https://loom-js-docs.vercel.app/docs) app';

    return [
        `# ${name}`,
        '',
        `${where}, created with \`@loom-js/create\`.`,
        '',
        '## Scripts',
        '',
        ...scripts.map(
            (script) =>
                `- \`${runCommand(packageManager, script)}\`: ${SCRIPT_PURPOSE[script]?.(context)}`
        ),
        ''
    ].join('\n');
};

// Dependencies whose install scripts pnpm 10+ must be told to run: esbuild
// always (the build tool), Tailwind's file watcher with Tailwind.
const buildScriptPackages = ({ choices }: RenderContext) => [
    ...(choices.tailwind ? ['@parcel/watcher'] : []),
    'esbuild'
];

const yamlKey = (name: string) => (/^[\w-]+$/.test(name) ? name : `'${name}'`);

/** `pnpm-workspace.yaml`: the workspace globs, then build-script approvals. */
export const renderPnpmWorkspace = (context: RenderContext) => {
    const packages = buildScriptPackages(context);

    // `allowBuilds` is pnpm 11+; `onlyBuiltDependencies` is what pnpm 10 reads.
    return [
        ...(context.choices.layout === 'monorepo'
            ? ['packages:', '    - apps/*', '    - packages/*']
            : []),
        'allowBuilds:',
        ...packages.map((name) => `    ${yamlKey(name)}: true`),
        'onlyBuiltDependencies:',
        ...packages.map((name) => `    - ${yamlKey(name)}`),
        ''
    ].join('\n');
};

/** Yarn 2+ defaults to Plug'n'Play, which esbuild can't resolve through. */
export const renderYarnrc = (
    version: string | undefined
): Record<string, string> =>
    version && Number(version.split('.')[0]) >= 2
        ? { '.yarnrc.yml': 'nodeLinker: node-modules\n' }
        : {};
