import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
    coverage: true,
    coverageConfig: {
        include: ['src/*'],
        exclude: ['src/index.ts', 'src/html-parser.ts']
    },
    files: ['tests/**/*.spec.ts'],
    nodeResolve: true,
    plugins: [esbuildPlugin({ ts: true, tsconfig: './tsconfig.spec.json' })],
    puppeteer: true
};
