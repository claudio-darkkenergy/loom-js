import { context } from 'esbuild';

import { clientConfig } from './config.mjs';

const runDev = async () => {
    const ctx = await context(
        clientConfig({
            apiUrl: process.env.API_URL,
            ctfIsPreview: process.env.CTF_IS_PREVIEW !== 'false'
        })
    );

    await ctx.watch();

    let { host, port } = await ctx.serve({
        port: 9092,
        servedir: './build',
        fallback: './build/index.html'
    });

    console.info(
        `esbuild is running the app on ~ ${
            host === '0.0.0.0' ? 'http://localhost' : host
        }:${port} ~`
    );
};

runDev();
