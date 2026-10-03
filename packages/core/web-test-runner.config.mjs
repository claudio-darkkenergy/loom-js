import { esbuildPlugin } from '@web/dev-server-esbuild';

import { minifiedFixturePlugin } from './tests/support/minified-fixture-plugin.mjs';

export default {
    coverage: true,
    coverageConfig: {
        include: ['src/*'],
        exclude: ['src/index.ts', 'src/html-parser.ts']
    },
    files: ['tests/**/*.spec.ts'],
    nodeResolve: true,
    plugins: [
        esbuildPlugin({ ts: true, tsconfig: './tests/tsconfig.json' }),
        minifiedFixturePlugin()
    ],
    puppeteer: true
};
