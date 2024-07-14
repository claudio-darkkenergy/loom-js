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
        entryPoints: {
            'static/js/spa': './src/routes/*',
            'static/styles/base': './public/styles/base.css'
        },
        format: 'esm',
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
                entryPoints: ['static/js/spa'],
                isProd,
                routes: ['/', '/core'],
                spa: true,
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
