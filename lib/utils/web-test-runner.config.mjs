import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
    coverage: true,
    coverageConfig: {
        include: ['src/*']
    },
    files: ['tests/**/*.spec.ts'],
    nodeResolve: true,
    plugins: [esbuildPlugin({ ts: true, tsconfig: './tests/tsconfig.json' })],
    puppeteer: true
};
