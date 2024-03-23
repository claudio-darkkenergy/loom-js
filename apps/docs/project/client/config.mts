import { BuildOptions } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';

export interface ClientConfigOptions {
    isProd?: boolean;
}

export const clientConfig = (options: ClientConfigOptions = {}) => {
    const { isProd = false } = options;

    return {
        bundle: true,
        entryPoints: {
            'static/js/home': './src/pages/index.ts',
            'static/js/learn/api': './src/pages/learn/api/index.ts',
            'static/js/learn/concepts': './src/pages/learn/concepts/index.ts',
            'static/js/learn/examples': './src/pages/learn/examples/index.ts',
            'static/styles/base': './public/styles/base.css',
            'static/styles/brand': './public/styles/brand.css'
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
            copy({
                assets: [
                    {
                        from: './public/**/*.html',
                        to: './'
                    },
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
        sourcemap: true
    } as BuildOptions;
};
