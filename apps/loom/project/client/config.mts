import { BuildOptions } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';
import { htmlSplit } from 'esbuild-plugin-html-split';

import { htmlTemplate } from './template.html.mjs';

export interface ClientConfigOptions {
    apiUrl?: string;
    ctfIsPreview?: boolean;
    isProd?: boolean;
    vercelEnv?: NodeJS.ProcessEnv;
}

const routes = ['/', '/docs'];

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const { apiUrl = '', ctfIsPreview = false, isProd = false } = options;

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
            'static/js/spa': './src/app/pages/routes',
            'static/styles/base': './public/styles/base.css'
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
        outdir: './build',
        plugins: [
            clean({ patterns: './build/*' }),
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
