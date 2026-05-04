import { htmlTemplate } from './template.html.mjs';
import { BuildOptions } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';
import { htmlSplit } from 'esbuild-plugin-html-split';

export interface ClientConfigOptions {
    isProd?: boolean;
}

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const { isProd = false } = options;

    return {
        bundle: true,
        define: {
            __API_URL__: `'${process.env.API_URL}'`
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
                    },
                    {
                        from: './mocks/**/*',
                        to: './mocks'
                    }
                ]
            })
        ],
        sourcemap: true,
        splitting: true
    } as BuildOptions;
};
