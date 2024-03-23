import { unlink } from 'fs';

import pkg from './package.json' assert { type: 'json' };
import terser from '@rollup/plugin-terser';
import typescriptRollupPlugin from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import typescript from 'typescript';

// Delete old typings to avoid issues
unlink('dist/index.d.ts', (err) => {
    if (err) {
        console.error(err);
        return;
    }

    console.info('dist/index.d.ts was deleted');
});

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: './src/index.ts',
        plugins: [
            // so Rollup can convert TypeScript to JavaScript
            typescriptRollupPlugin({
                tsconfig: './tsconfig.json',
                typescript
            }),
            terser({
                keep_fnames: true
            })
        ],
        output: [
            { file: pkg.module, format: 'es', sourcemap: true },
            { file: pkg.main, format: 'cjs', sourcemap: true }
        ]
    },
    // Consolidates all the type defintion files into 1,
    // & then deletes the root typings folder & defintion files.
    {
        input: './dist/typings/index.d.ts',
        output: { file: pkg.types, format: 'es' },
        plugins: [dts(), del({ hook: 'buildEnd', targets: 'dist/typings' })]
    }
];
