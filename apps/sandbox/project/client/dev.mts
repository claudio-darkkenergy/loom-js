import { context } from 'esbuild';

import { clientConfig } from './config.mjs';

const runDev = async () => {
    const ctx = await context(clientConfig({ apiUrl: process.env.API_URL }));

    await ctx.watch();

    const { hosts, port } = await ctx.serve({
        port: 1001,
        servedir: './build',
        fallback: './build/index.html'
    });
    const host = hosts[0] ?? 'localhost';

    console.info(
        `esbuild is running the app on ~ ${
            host === '0.0.0.0' ? 'http://localhost' : host
        }:${port} ~`
    );
};

runDev();
