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

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const { apiUrl = '', ctfIsPreview = false, isProd = false } = options;

    return {
        logLevel: isProd ? 'silent' : 'debug',
        bundle: true,
        define: {
            __API_URL__: `'${apiUrl}'`,
            __CTF_IS_PREVIEW__: `${ctfIsPreview}`
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
                    getTitle: () => 'Home | Loomjs'
                },
                isProd,
                routes: ['/', '/docs'],
                spa: 'static/js/index',
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
