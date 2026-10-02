import { defineConfig } from '@loom-js/build';

export default defineConfig({
    define: { __API_URL__: process.env.API_URL ?? '' },
    entry: './src/routes/pages.ts',
    html: { title: () => 'Sandbox' },
    publicDir: './public/static',
    routes: ['/', '/core', '/event-monitoring', '/lazyload'],
    server: { port: 1001 },
    styles: ['./public/styles/base.css']
});
