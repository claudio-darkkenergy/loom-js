import rollupAlias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import { esbuildPlugin } from '@web/dev-server-esbuild';
// The adapter required to wrap used Rollup plugins.
import { fromRollup } from '@web/dev-server-rollup';
import path from 'path';
import rollupPostcss from 'rollup-plugin-postcss';

const CWD = process.cwd();
const alias = fromRollup(rollupAlias);
const postcss = fromRollup(rollupPostcss);
const customResolver = resolve({
    extensions: ['.ts', '.js', '.css']
});

export default {
    input: './app/index.html',
    // Path to SPA index.html from the project root.
    appIndex: './app/index.html',
    // Cleans up the `basePath` value from the requested URL pathname - needed since the index.html
    // is getting served from the directory.
    basePath: '/app/',
    debug: false,
    mimeTypes: {
        // serve .module.css files as js
        '**/*.module.css': 'js'
    },
    nodeResolve: {
        extensions: ['.ts', '.js', '.css']
    },
    plugins: [
        alias({
            customResolver,
            // Paths should be absolute to avoid any issues.
            entries: {
                '@app': path.resolve(CWD, './app')
            }
        }),
        postcss({
            autoModules: true
            // Or with custom options for `postcss-modules`
            // modules: {
            // }
        }),
        esbuildPlugin({
            target: 'auto',
            ts: true
        })
        // rollupBundlePlugin({
        //     rollupConfig: {
        //         // input: ['./app/'],
        //         plugins: [
        //             rollupPostcss({
        //                 modules: true
        //                 // Or with custom options for `postcss-modules`
        //                 // modules: {

        //                 // }
        //             })
        //         ]
        //     }
        // })
    ],
    port: 5500,
    // Path to the directory where the app's HTML should be served from.
    rootDir: './app',
    watch: true
};
