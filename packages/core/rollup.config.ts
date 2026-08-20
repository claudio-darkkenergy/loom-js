import { unlink } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
import terser from '@rollup/plugin-terser';
import typescriptRollupPlugin from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';

const pkg = require('./package.json');

// Delete old typings to avoid issues
for (const typings of ['dist/index.d.ts', 'dist/server.d.ts']) {
    unlink(typings, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        console.info(`${typings} was deleted`);
    });
}

// Shared by the browser (`.`) and server (`./server`) entries.
const jsPlugins = () => [
    // so Rollup can convert TypeScript to JavaScript.

    // Must use its own nested typescript 6 (see .pnpmfile.cjs) — do not pass

    // the workspace's typescript@7 here; it lacks the legacy compiler API.
    typescriptRollupPlugin({
        tsconfig: './tsconfig.json'
    }),
    terser({
        format: { preserve_annotations: true },
        keep_fnames: true
    })
];

const rollupConfig = [
    // CommonJS (for Node) and ES module (for bundlers) build.
    // Both package entries build from ONE config so rollup code-splits their
    // shared modules into a common chunk. That is load-bearing, not an
    // optimization: `lib/dom`'s render-scoped window (and the lifecycle/
    // element-registration stores) must be the same module instance whether
    // reached via `.` or `./server` — separate bundles would give the server
    // entry its own dead copy of that state.
    {
        input: { index: './src/index.ts', server: './src/server.ts' },
        plugins: jsPlugins(),
        output: [
            {
                chunkFileNames: 'chunks/[name]-[hash].mjs',
                dir: 'dist',
                entryFileNames: '[name].mjs',
                format: 'es',
                sourcemap: true
            },
            {
                chunkFileNames: 'chunks/[name]-[hash].js',
                dir: 'dist',
                entryFileNames: '[name].js',
                format: 'cjs',
                sourcemap: true
            }
        ]
    },
    // Consolidates all the type defintion files into 1 per entry,
    // & then deletes the root typings folder & defintion files.
    {
        input: './dist/typings/index.d.ts',
        output: { file: pkg.exports['.'].types, format: 'es' },
        plugins: [dts()]
    },
    {
        input: './dist/typings/server.d.ts',
        output: { file: pkg.exports['./server'].types, format: 'es' },
        // The delete must ride the LAST dts config — earlier configs still
        // read from dist/typings.
        plugins: [dts(), del({ hook: 'buildEnd', targets: 'dist/typings' })]
    }
];

export default rollupConfig;
