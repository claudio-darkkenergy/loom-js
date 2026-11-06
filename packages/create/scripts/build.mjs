// Builds `@loom-js/create`: the CLI at `dist/index.mjs` with the stamped
// dependency ranges inlined, then the template trees (see `templates.mjs`).
import { build } from 'esbuild';

import { buildTemplates } from './templates.mjs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

// The workspace packages a template can depend on.
const LOOM_PACKAGES = ['build', 'core', 'devtools', 'pink'];
// Third-party tools a template can depend on, at this package's own ranges.
const TOOL_PACKAGES = [
    '@biomejs/biome',
    '@tailwindcss/cli',
    'prettier',
    'tailwindcss',
    'turbo',
    'typescript'
];

const readManifest = async (directory) =>
    JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));

/** `^<version>` per `@loom-js` package, plus the tool ranges. */
export const stampedRanges = async () => {
    const ownManifest = await readManifest(root);
    const loomEntries = await Promise.all(
        LOOM_PACKAGES.map(async (name) => {
            const { version } = await readManifest(path.join(root, '..', name));

            return [`@loom-js/${name}`, `^${version}`];
        })
    );
    const toolEntries = TOOL_PACKAGES.map((name) => {
        const range = ownManifest.devDependencies[name];

        if (!range) {
            throw new Error(`[create] ${name} is not a devDependency.`);
        }

        return [name, range];
    });

    return Object.fromEntries([...loomEntries, ...toolEntries]);
};

const buildCli = async (ranges) =>
    build({
        absWorkingDir: root,
        bundle: true,
        define: { __STAMPED_RANGES__: JSON.stringify(ranges) },
        entryPoints: ['src/index.ts'],
        format: 'esm',
        logLevel: 'warning',
        outfile: 'dist/index.mjs',
        packages: 'external',
        platform: 'node',
        target: 'node20'
    });

await rm(dist, { force: true, recursive: true });
await buildCli(await stampedRanges());

// The built CLI owns the formatter registry, so the trees use its configs.
const { REGISTRIES } = await import(
    pathToFileURL(path.join(dist, 'index.mjs')).href
);

await buildTemplates({
    binDirectory: path.join(root, 'node_modules', '.bin'),
    formatters: REGISTRIES.formatters,
    outDirectory: path.join(dist, 'templates'),
    sourceDirectory: path.join(root, 'templates')
});
