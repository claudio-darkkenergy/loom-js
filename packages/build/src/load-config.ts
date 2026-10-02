// Loads `loom.config.*`: the file is bundled with esbuild to a sibling temp
// module and imported, so TypeScript configs need no loader hook and
// relative imports (an app's own prerender helpers) come along. Bare
// specifiers stay external and resolve from the config's own location.
import { build } from 'esbuild';

import type { LoomConfigExport } from './config';
import { access, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIG_FILE_NAMES = [
    'loom.config.ts',
    'loom.config.mts',
    'loom.config.js',
    'loom.config.mjs'
];

const exists = (filePath: string) =>
    access(filePath).then(
        () => true,
        () => false
    );

/** The first `loom.config.*` under `cwd`, or `undefined`. */
export const findConfigFile = async (cwd: string) => {
    for (const fileName of CONFIG_FILE_NAMES) {
        const filePath = path.join(cwd, fileName);

        if (await exists(filePath)) {
            return filePath;
        }
    }

    return undefined;
};

export interface LoadedConfig {
    config: LoomConfigExport;
    /** The config file's absolute path. */
    file: string;
}

/** Bundles and imports a config file; its default export is the config. */
export const loadConfigFile = async (file: string): Promise<LoadedConfig> => {
    const configPath = path.resolve(file);
    const tempPath = path.join(
        path.dirname(configPath),
        `.${path.basename(configPath)}.${Date.now()}.mjs`
    );

    await build({
        bundle: true,
        entryPoints: [configPath],
        format: 'esm',
        logLevel: 'silent',
        outfile: tempPath,
        packages: 'external',
        platform: 'node',
        sourcemap: 'inline',
        target: `node${process.versions.node.split('.')[0]}`
    });

    try {
        const loaded = (await import(pathToFileURL(tempPath).href)) as {
            default?: LoomConfigExport;
        };

        if (!loaded.default) {
            throw new Error(
                `[loom] ${path.basename(configPath)} has no default export — export the result of defineConfig().`
            );
        }

        return { config: loaded.default, file: configPath };
    } finally {
        await rm(tempPath, { force: true });
    }
};

/** Finds and loads the config under `cwd`; `file` skips the lookup. */
export const loadConfig = async (cwd: string, file?: string) => {
    const configFile = file ? path.resolve(cwd, file) : await findConfigFile(cwd);

    if (!configFile) {
        throw new Error(
            `[loom] no ${CONFIG_FILE_NAMES[0]} found in ${cwd} (also looked for ${CONFIG_FILE_NAMES.slice(1).join(', ')}).`
        );
    }

    return loadConfigFile(configFile);
};
