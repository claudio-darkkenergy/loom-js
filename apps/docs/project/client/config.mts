import { htmlTemplate } from './html-template.mjs';
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
            'static/js/index': './src/pages/index.ts',
            'static/js/learn/api': './src/pages/learn/api/index.ts',
            'static/js/learn/concepts': './src/pages/learn/concepts/index.ts',
            'static/js/learn/examples': './src/pages/learn/examples/index.ts',
            'static/styles/base': './public/styles/base.css'
            // 'static/styles/brand': './public/styles/brand.css'
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
                define: {
                    getTitle: () => 'Home | Loomjs'
                },
                entryPoints: [
                    'static/js/index',
                    'static/js/learn/api',
                    'static/js/learn/concepts',
                    'static/js/learn/examples'
                ],
                isProd,
                // routes: [
                //     '/',
                //     '/learn/api',
                //     '/learn/concepts',
                //     '/learn/examples'
                // ],
                // spa: true,
                template: htmlTemplate,
                verbose: true
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
