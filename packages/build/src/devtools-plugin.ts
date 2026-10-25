// Devtools wiring for a build: names every top-level `component` /
// `defineElement` declaration from its binding, and registers the lazy
// `@loom-js/devtools` loader ahead of the entry's own imports.
import type { Loader, Plugin, PluginBuild } from 'esbuild';

import type { DevtoolsSetting } from './config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DEVTOOLS_PACKAGE = '@loom-js/devtools';
const CORE_DEVTOOLS = '@loom-js/core/devtools';
const REGISTER_MODULE = 'loom-devtools:register';
const SOURCE_FILTER = /\.[cm]?[jt]sx?$/;
// A column-0 declaration bound to a `component(` / `defineElement(` call,
// optionally exported, type-annotated or given generic arguments.
const DECLARATION =
    /^(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(?:component|defineElement)\s*[<(]/gm;

export interface DevtoolsPluginOptions {
    // The SPA entry module — the one the loader registration rides on.
    entry: string;
    // Whether devtools applies to this build's mode.
    active: boolean;
    root: string;
    setting: DevtoolsSetting;
    // Whether the app set `devtools` itself (a missing package then fails).
    explicit: boolean;
}

/**
 * The binding names a module declares components under (top level only).
 * @param source The module source.
 * @returns The binding names, in source order.
 */
export const componentBindingsOf = (source: string) =>
    Array.from(source.matchAll(DECLARATION), (match) => match[1]!);

/**
 * Appends the naming calls for a module's component bindings.
 * @param source The module source.
 * @returns The source with naming calls appended, or `undefined` when it
 *      declares no components.
 */
export const injectComponentNames = (source: string) => {
    const bindings = componentBindingsOf(source);

    return bindings.length
        ? `${source}\n;import { nameComponent as __loomNameComponent } from '${CORE_DEVTOOLS}';\n${bindings
              .map(
                  (binding) =>
                      `__loomNameComponent(${binding}, ${JSON.stringify(binding)});`
              )
              .join('\n')}\n`
        : undefined;
};

const loaderOf = (filePath: string): Loader => {
    const extension = path.extname(filePath).slice(1);

    return extension === 'mts' || extension === 'cts'
        ? 'ts'
        : extension === 'mjs' || extension === 'cjs'
          ? 'js'
          : (extension as Loader);
};

const resolves = async (build: PluginBuild, specifier: string, root: string) =>
    !(
        await build.resolve(specifier, {
            kind: 'import-statement',
            resolveDir: root
        })
    ).errors.length;

/**
 * The esbuild plugin behind the `devtools` config key.
 * @param options The resolved devtools setting for this build.
 */
export const devtoolsPlugin = ({
    active,
    entry,
    explicit,
    root,
    setting
}: DevtoolsPluginOptions): Plugin => ({
    name: 'loom-devtools',
    setup(build) {
        // Names and the loader go in together: names only serve devtools.
        let wired = false;
        // The entry as loaded — the config may name it without an extension.
        let entryPath = entry;

        build.onStart(async () => {
            wired = false;

            if (!active) {
                return;
            }

            const hasCore = await resolves(build, CORE_DEVTOOLS, root);
            const hasPackage = await resolves(build, DEVTOOLS_PACKAGE, root);

            if (explicit && !(hasCore && hasPackage)) {
                return {
                    errors: [
                        {
                            text: `[loom] \`devtools: ${JSON.stringify(setting)}\` needs ${
                                hasCore
                                    ? DEVTOOLS_PACKAGE
                                    : `${CORE_DEVTOOLS} (upgrade @loom-js/core)`
                            } — install it, or set \`devtools: false\`.`
                        }
                    ]
                };
            }

            wired = hasCore && hasPackage;
            entryPath =
                (
                    await build.resolve(entry, {
                        kind: 'entry-point',
                        resolveDir: root
                    })
                ).path || entry;
        });

        build.onResolve({ filter: /^loom-devtools:register$/ }, () => ({
            namespace: 'loom-devtools',
            path: 'register'
        }));

        build.onLoad({ filter: /.*/, namespace: 'loom-devtools' }, () => ({
            contents: `import { registerDevtools } from '${CORE_DEVTOOLS}';\nregisterDevtools(() => import('${DEVTOOLS_PACKAGE}'));\n`,
            loader: 'js',
            resolveDir: root
        }));

        build.onLoad({ filter: SOURCE_FILTER }, async ({ path: filePath }) => {
            if (!wired || filePath.endsWith('.d.ts')) {
                return undefined;
            }

            const isEntry = filePath === entryPath;
            const source = await readFile(filePath, 'utf8');
            const named = injectComponentNames(source);

            if (!named && !isEntry) {
                return undefined;
            }

            return {
                contents: `${isEntry ? `import '${REGISTER_MODULE}';\n` : ''}${named ?? source}`,
                loader: loaderOf(filePath)
            };
        });
    }
});
