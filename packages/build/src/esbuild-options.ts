// Assembles the esbuild options from a resolved config: the tool's fixed
// layout (`static/js/spa`, `static/styles/*`, `static/js/prerender`) and
// mode-driven defaults, then the config's `esbuild` escape hatch last.
// Every path is absolute and `absWorkingDir` is the project root, so the
// build never depends on the process's working directory.
import { htmlSplit } from '@loom-js/esbuild-plugin-html-split';
import type { BuildOptions } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

import type { ResolvedConfig } from './config';
import { PRERENDER_ENTRY_NAME, createTemplate } from './template';
import path from 'node:path';

export const SPA_ENTRY_NAME = 'static/js/spa';
export const STYLES_DIR = 'static/styles';
export const PUBLIC_DIR_TARGET = './static';

const styleEntryName = (stylePath: string) =>
    `${STYLES_DIR}/${path.basename(stylePath, path.extname(stylePath))}`;

export const createBuildOptions = (config: ResolvedConfig): BuildOptions => {
    const isProd = config.mode === 'production';
    const entryPoints: Record<string, string> = {
        [SPA_ENTRY_NAME]: path.resolve(config.root, config.entry)
    };

    for (const stylePath of config.styles) {
        entryPoints[styleEntryName(stylePath)] = path.resolve(
            config.root,
            stylePath
        );
    }

    if (config.prerender) {
        // Build-time-only bundle; the template keeps it out of shells.
        // Sharing the client build keeps css-module class names and the
        // core module instance identical with the shipped app.
        entryPoints[PRERENDER_ENTRY_NAME] = path.resolve(
            config.root,
            config.prerender.entry
        );
    }

    const define: Record<string, string> = { __DEV__: String(!isProd) };

    for (const [name, value] of Object.entries(config.define)) {
        define[name] = JSON.stringify(value);
    }

    const assets = [
        ...(config.publicDir
            ? [
                  {
                      from: path.join(config.publicDir, '**/*'),
                      to: PUBLIC_DIR_TARGET
                  }
              ]
            : []),
        ...config.copy
    ].map(({ from, to }) => ({
        // The copy plugin globs `from` against the process cwd.
        from: path.resolve(config.root, from),
        to
    }));
    const options: BuildOptions = {
        absWorkingDir: config.root,
        bundle: true,
        define,
        entryPoints,
        format: 'esm',
        keepNames: true,
        loader: {
            '.eot': 'file',
            '.ttf': 'file',
            '.woff': 'file',
            '.woff2': 'file',
            '.svg': 'file'
        },
        logLevel: isProd ? 'warning' : 'info',
        minify: isProd,
        outdir: config.outDir,
        plugins: [
            htmlSplit({
                // With the entry points named, the plugin classifies dynamic
                // route chunks as common resources instead of extra entries.
                entryPoints: [SPA_ENTRY_NAME],
                isProd,
                routes: config.routes,
                spa: SPA_ENTRY_NAME,
                template: createTemplate({
                    html: config.html,
                    mode: config.mode,
                    routes: config.routes
                }),
                // Full minify needs one mangle pool across js and css —
                // costs a second build pass, so prod only.
                twoPassCss: isProd
            }),
            ...(assets.length ? [copy({ assets, resolveFrom: 'out' })] : [])
        ],
        sourcemap: !isProd,
        splitting: true
    };

    return config.esbuild
        ? config.esbuild(options, { mode: config.mode })
        : options;
};
