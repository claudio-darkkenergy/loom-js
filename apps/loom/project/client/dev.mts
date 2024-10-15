import { clientConfig } from './config.mjs';
import { context } from 'esbuild';

const runDev = async () => {
    const ctx = await context(clientConfig({ apiUrl: process.env.API_URL }));

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
