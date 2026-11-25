import { context } from 'esbuild';

import type { ResolvedConfig } from './config';
import { createDevRunner, type DevRunner } from './dev-runner';
import { createBuildOptions } from './esbuild-options';
import { ROOT_SHELL_FILE } from './prerender';
import { rm } from 'node:fs/promises';
import path from 'node:path';

export interface DevOptions {
    /** Render every route on each run, as a production build does. */
    prerender?: boolean;
}

const NOTHING_TO_RUN =
    '[loom dev] the config has no `prerender` section — nothing to run.';

const runnerFor = (
    config: ResolvedConfig,
    renderRoutes: boolean
): DevRunner | undefined => {
    if (!config.prerender) {
        renderRoutes && console.info(NOTHING_TO_RUN);

        return undefined;
    }

    if (!config.configSource) {
        console.warn(
            '[loom dev] the prerender hooks need the config file — pass `configFile` to resolveConfig.'
        );

        return undefined;
    }

    return createDevRunner(config, {
        configSource: config.configSource,
        renderRoutes
    });
};

// `r` + Enter in an interactive terminal; never attached in CI or pipes.
const listenForRefresh = (refresh: () => void) => {
    const { stdin } = process;

    if (!stdin.isTTY) {
        return () => {};
    }

    const onData = (chunk: Buffer) => {
        chunk.toString().trim() === 'r' && refresh();
    };

    stdin.on('data', onData);

    return () => {
        stdin.off('data', onData);
        stdin.pause();
    };
};

/**
 * The dev server: watches and rebuilds into `outDir`, serving it with the
 * root shell as the SPA fallback for every unknown path. With `prerender`
 * configured, runs `setup` and `artifacts` on start, after every successful
 * rebuild and on `refresh()` (`r` + Enter) — plus route rendering with
 * `options.prerender`. A hook failure is a warning, never a stop.
 */
export const dev = async (
    config: ResolvedConfig,
    { prerender: renderRoutes = false }: DevOptions = {}
) => {
    await rm(config.outDir, { force: true, recursive: true });

    const runner = runnerFor(config, renderRoutes);
    const options = createBuildOptions(config);
    const ctx = await context(
        runner
            ? {
                  ...options,
                  plugins: [...(options.plugins ?? []), runner.plugin]
              }
            : options
    );

    await ctx.watch();

    // Rendered routes overwrite the root `index.html`; unknown paths get
    // the pristine shell, as in production.
    const fallbackFile =
        runner && renderRoutes ? ROOT_SHELL_FILE : 'index.html';
    const { hosts, port } = await ctx.serve({
        fallback: path.join(config.outDir, fallbackFile),
        host: config.server.host,
        port: config.server.port,
        servedir: config.outDir
    });
    const host = hosts[0] ?? 'localhost';
    const refresh = () =>
        runner ? runner.schedule() : console.info(NOTHING_TO_RUN);
    const detachStdin = listenForRefresh(refresh);

    console.info(
        `loom dev ~ http://${host === '0.0.0.0' ? 'localhost' : host}:${port} ~`
    );
    runner &&
        process.stdin.isTTY &&
        console.info('[loom dev] r + Enter re-runs the prerender hooks.');

    const stop = async () => {
        detachStdin();
        await runner?.stop();
        await ctx.dispose();
    };

    return { ctx, hosts, port, refresh, stop };
};
