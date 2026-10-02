import { defineConfig } from '@loom-js/build';

import { prerenderHooks } from './prerender-hooks';

export default defineConfig(({ mode }) => ({
    define: { __FIXTURE_NAME__: `fixture (${mode})` },
    entry: './src/bootstrap.ts',
    html: {
        bodyClass: 'theme-fixture',
        head: () => '    <link rel="dns-prefetch" href="https://example.test" />',
        title: (scope) => (scope === '/docs' ? 'Docs | Fixture' : 'Fixture')
    },
    prerender: prerenderHooks,
    publicDir: './public/static',
    routes: ['/', '/docs'],
    server: { port: 1999 },
    styles: ['./public/base.css']
}));
