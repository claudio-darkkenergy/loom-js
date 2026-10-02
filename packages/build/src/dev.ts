import { context } from 'esbuild';

import type { ResolvedConfig } from './config';
import { createBuildOptions } from './esbuild-options';
import { rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * The dev server: watches and rebuilds into `outDir`, serving it with the
 * root shell as the SPA fallback for every unknown path. Never prerenders.
 */
export const dev = async (config: ResolvedConfig) => {
    await rm(config.outDir, { force: true, recursive: true });

    const ctx = await context(createBuildOptions(config));

    await ctx.watch();

    const { hosts, port } = await ctx.serve({
        fallback: path.join(config.outDir, 'index.html'),
        host: config.server.host,
        port: config.server.port,
        servedir: config.outDir
    });
    const host = hosts[0] ?? 'localhost';

    console.info(
        `loom dev ~ http://${host === '0.0.0.0' ? 'localhost' : host}:${port} ~`
    );

    return { ctx, hosts, port };
};
