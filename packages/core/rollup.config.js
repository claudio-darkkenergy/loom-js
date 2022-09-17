import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

// Delete old typings to avoid issues
require('fs').unlink('dist/index.d.ts', (err) => console.error(err));

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: './src/index.ts',
        external: [...Object.keys(pkg.dependencies || {})],
        plugins: [
            // so Rollup can convert TypeScript to JavaScript
            typescript({
                clean: true,
                tsconfig: './tsconfig.json',
                typescript: require('typescript'),
                useTsconfigDeclarationDir: true
            }),
            terser()
        ],
        output: [{ file: pkg.module, format: 'es', sourcemap: true }]
    },
    // Consolidates all the type defintion files into 1,
    // & then deletes the root typings folder & defintion files.
    {
        input: './dist/typings/index.d.ts',
        output: [{ file: './dist/index.d.ts', format: 'es' }],
        plugins: [dts(), del({ hook: 'buildEnd', targets: 'dist/typings' })]
    }
];
