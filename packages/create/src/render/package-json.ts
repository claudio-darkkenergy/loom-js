import { toPackageJson } from '../json';
import { rangeOf } from '../versions';
import {
    formatterInApp,
    type RenderContext,
    TAILWIND_INPUT,
    TAILWIND_OUTPUT
} from './context';

const sorted = (record: Record<string, string>) =>
    Object.fromEntries(
        Object.entries(record).sort(([left], [right]) =>
            left.localeCompare(right)
        )
    );

const rangesOf = (names: readonly string[]) =>
    sorted(Object.fromEntries(names.map((name) => [name, rangeOf(name)])));

/** The formatter's `format` / `format:check` scripts. */
export const formatterScripts = ({
    formatter
}: RenderContext): Record<string, string> =>
    formatter
        ? {
              format: formatter.fixCommand.join(' '),
              'format:check': formatter.checkCommand.join(' ')
          }
        : {};

/** The app's `package.json`: `web` inside a monorepo, the root name otherwise. */
export const renderAppPackageJson = (context: RenderContext) => {
    const { choices, formatter, name, uiKit } = context;
    const tailwindBuild = `tailwindcss -i ${TAILWIND_INPUT} -o ${TAILWIND_OUTPUT}`;
    const ownsFormatter = formatterInApp(context);

    return toPackageJson({
        name: choices.layout === 'monorepo' ? 'web' : name,
        version: '0.0.0',
        private: true,
        type: 'module',
        scripts: sorted({
            build: choices.tailwind
                ? `${tailwindBuild} && loom build`
                : 'loom build',
            dev: choices.tailwind ? 'node scripts/dev.mjs' : 'loom dev',
            ...(choices.js ? {} : { 'type-check': 'tsc --noEmit' }),
            ...(ownsFormatter ? formatterScripts(context) : {})
        }),
        dependencies: rangesOf(['@loom-js/core', ...(uiKit?.packages ?? [])]),
        devDependencies: rangesOf([
            '@loom-js/build',
            '@loom-js/devtools',
            ...(choices.js ? [] : ['typescript']),
            ...(choices.tailwind ? ['@tailwindcss/cli', 'tailwindcss'] : []),
            ...(ownsFormatter && formatter ? formatter.devDependencies : [])
        ])
    });
};

/** The workspace root's `package.json`. */
export const renderRootPackageJson = (
    context: RenderContext,
    scripts: readonly string[],
    packageManagerField: string | undefined
) => {
    const { formatter, name, packageManager, taskRunner } = context;

    if (!taskRunner) {
        throw new Error('[create] a monorepo needs a task runner.');
    }

    return toPackageJson({
        name,
        private: true,
        ...(packageManagerField ? { packageManager: packageManagerField } : {}),
        ...(packageManager.name === 'pnpm'
            ? {}
            : { workspaces: ['apps/*', 'packages/*'] }),
        scripts: sorted({
            ...Object.fromEntries(
                scripts.map((script) => [script, taskRunner.runScript(script)])
            ),
            ...formatterScripts(context)
        }),
        devDependencies: rangesOf([
            ...taskRunner.devDependencies,
            ...(formatter?.devDependencies ?? [])
        ])
    });
};
