import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
    coverage: true,
    coverageConfig: {
        exclude: ['node_modules/**/*', 'tests/support/**/*']
    },
    files: ['tests/**/*.spec.ts'],
    nodeResolve: true,
    plugins: [esbuildPlugin({ ts: true })],
    puppeteer: true,
    watch: true,
};
