import terser from '@rollup/plugin-terser';
import typescriptRollupPlugin from '@rollup/plugin-typescript';
import { readFileSync, rmSync } from 'fs';
import type { RollupOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Delete old typings to avoid issues
rmSync('dist/index.d.ts', { force: true });

export default [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        external: ['@loom-js/core', /^prismjs(\/|$)/],
        input: './src/index.ts',
        plugins: [
            // so Rollup can convert TypeScript to JavaScript.

            // Must use its own nested typescript 6 (see .pnpmfile.cjs) — do not pass

            // the workspace's typescript@7 here; it lacks the legacy compiler API.
            typescriptRollupPlugin({
                tsconfig: './tsconfig.json'
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
        output: [{ file: pkg.types, format: 'es' }],
        plugins: [dts(), del({ hook: 'buildEnd', targets: 'dist/typings' })]
    }
] satisfies RollupOptions[];
