import { esbuildPlugin } from '@web/dev-server-esbuild';

import { readFrontend } from './scripts/build.mjs';

// `test-ci` builds the frontend first; the backend under test inlines it
// exactly as the package build does.
const { script, style } = await readFrontend();

export default {
    files: ['tests/**/*.spec.ts'],
    nodeResolve: true,
    plugins: [
        esbuildPlugin({
            define: {
                __LOOM_DEVTOOLS_FRONTEND_SCRIPT__: JSON.stringify(script),
                __LOOM_DEVTOOLS_FRONTEND_STYLE__: JSON.stringify(style)
            },
            ts: true,
            tsconfig: './tests/tsconfig.json'
        })
    ],
    puppeteer: true
};
