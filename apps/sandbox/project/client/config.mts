import { BuildOptions } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';
import { htmlSplit } from 'esbuild-plugin-html-split';

import { htmlTemplate } from './template.html.mjs';

export interface ClientConfigOptions {
    apiUrl?: string;
    isProd?: boolean;
}

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const { apiUrl = '', isProd = false } = options;

    return {
        bundle: true,
        define: {
            __API_URL__: `'${apiUrl}'`
        },
        format: 'esm',
        entryPoints: {
            'static/js/spa': './src/routes/*',
            'static/styles/base': './public/styles/base.css'
        },
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
                isProd,
                routes: ['/', '/core', '/event-monitoring', '/lazyload'],
                spa: 'static/js/spa',
                template: htmlTemplate
            }),
            copy({
                assets: [
                    {
                        from: './public/static/**/*',
                        to: './static'
                    }
                ]
            })
        ],
        sourcemap: true,
        splitting: true
    } as BuildOptions;
};
