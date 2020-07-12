import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

// Delete old typings to avoid issues
require('fs').unlink('dist/index.d.ts', (err) => {});

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: 'src/index.ts',
        external: [...Object.keys(pkg.dependencies || {})],
        plugins: [
            typescript({
                clean: true,
                typescript: require('typescript')
            }), // so Rollup can convert TypeScript to JavaScript
            terser()
        ],
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'es', sourcemap: true }
        ]
    }
];
