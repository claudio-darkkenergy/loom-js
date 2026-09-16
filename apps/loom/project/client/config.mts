import { BuildOptions } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';
import { htmlSplit } from 'esbuild-plugin-html-split';

import { htmlTemplate } from './template.html.mjs';

export interface ClientConfigOptions {
    apiUrl?: string;
    ctfIsPreview?: boolean;
    isProd?: boolean;
    // Emission dir — './build' (what Vercel serves) unless a caller isolates
    // a build (e.g. LOOM_BUILD_DIR in tests/CI).
    outdir?: string;
    vercelEnv?: NodeJS.ProcessEnv;
}

const routes = ['/', '/docs'];

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const {
        apiUrl = '',
        ctfIsPreview = false,
        isProd = false,
        outdir = './build'
    } = options;

    return {
        logLevel: isProd ? 'silent' : 'debug',
        bundle: true,
        define: {
            __API_URL__: `'${apiUrl}'`,
            __CTF_IS_PREVIEW__: `${ctfIsPreview}`,
            __DEV__: `${!isProd}`
        },
        format: 'esm',
        entryPoints: {
            'static/js/spa': './src/app/bootstrap',
            'static/styles/base': './public/styles/base.css',
            // Build-time-only bundle; the html template keeps it out of
            // shells. Sharing the client build keeps css-module class names
            // and the core module instance identical with the shipped app.
            'static/js/prerender': './src/app/prerender.entry'
        },
        keepNames: true,
        loader: {
            '.eot': 'file',
            '.ttf': 'file',
            '.woff': 'file',
            '.woff2': 'file',
            '.svg': 'file'
        },
        minify: isProd,
        outdir,
        plugins: [
            // `del` refuses paths outside the cwd — an isolated outdir
            // (LOOM_BUILD_DIR) is wiped by build.mts instead.
            ...(outdir.startsWith('./')
                ? [clean({ patterns: `${outdir}/*` })]
                : []),
            htmlSplit({
                define: {
                    apiUrl,
                    getTitle: (scope: string) =>
                        scope === '/docs' ? 'Docs | Loomjs' : 'Home | Loomjs',
                    isProd,
                    // The template drops another route's chunks from a shell
                    // only when the resource's scope prefix is known here.
                    routeScopes: routes.map((route) =>
                        route === '/' ? '/pages' : route
                    )
                },
                // With the entry points named, the plugin classifies dynamic
                // route chunks as common resources instead of extra entries.
                entryPoints: ['static/js/spa'],
                isProd,
                routes,
                spa: 'static/js/spa',
                template: htmlTemplate,
                verbose: false
            }),
            copy({
                assets: [
                    {
                        from: './public/static/**/*',
                        to: './static'
                    },
                    {
                        from: './mocks/**/*',
                        to: './mocks'
                    }
                ]
            })
        ],
        sourcemap: !isProd,
        splitting: true
    } as BuildOptions;
};
