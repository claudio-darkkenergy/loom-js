import { context } from 'esbuild';

import { clientConfig } from './config.mjs';

const runDev = async () => {
    const ctx = await context(
        clientConfig({
            apiUrl: process.env.API_URL,
            // Preview is an explicit opt-in (`.env.local` sets it for dev).
            ctfIsPreview: process.env.CTF_IS_PREVIEW === 'true'
        })
    );

    await ctx.watch();

    const { hosts, port } = await ctx.serve({
        port: 9092,
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
