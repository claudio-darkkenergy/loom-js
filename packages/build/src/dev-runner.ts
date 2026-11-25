// Schedules `loom dev`'s prerender runs: after every error-free rebuild and
// on demand, one at a time, each in its own worker (see `dev-worker.ts`).
// Failures are warnings; the server never stops for a hook.
import type { Plugin } from 'esbuild';

import type { ConfigSource, ResolvedConfig } from './config';
import type { DevRunInput, DevRunResult } from './dev-worker';
import { routeOutputPath, shellFileOf } from './prerender';
import { access, copyFile } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';

const DEV_WORKER_URL = new URL('./dev-worker.mjs', import.meta.url);

const exists = (filePath: string) =>
    access(filePath).then(
        () => true,
        () => false
    );

export interface DevRunner {
    /** Appended to the dev build: schedules a run after each error-free build. */
    plugin: Plugin;
    /** Runs now, or once more after the run in flight. */
    schedule: () => void;
    stop: () => Promise<void>;
}

export interface DevRunnerOptions {
    configSource: ConfigSource;
    /** Render every route on each run (`loom dev --prerender`). */
    renderRoutes: boolean;
}

const report = (result: DevRunResult, renderRoutes: boolean) => {
    if (result.ok) {
        console.info(
            renderRoutes
                ? `[loom dev] prerender run complete: ${result.routeCount} route(s).`
                : '[loom dev] prerender hooks ran.'
        );

        return;
    }

    console.warn(
        `[loom dev] ${result.hook} failed: ${result.message} — generated files are from the last good run.`
    );
};

export const createDevRunner = (
    config: ResolvedConfig,
    { configSource, renderRoutes }: DevRunnerOptions
): DevRunner => {
    const { outDir } = config;
    let running = false;
    let queued = false;
    let stopped = false;
    let worker: Worker | undefined;

    const runOnce = () =>
        new Promise<void>((resolve) => {
            const input: DevRunInput = { configSource, outDir, renderRoutes };
            const current = new Worker(DEV_WORKER_URL, { workerData: input });
            let settled = false;
            const finish = (result: DevRunResult) => {
                if (settled) {
                    return;
                }

                settled = true;
                worker = undefined;
                // A hook may leave handles open; the run is over either way.
                void current.terminate();
                stopped || report(result, renderRoutes);
                resolve();
            };

            worker = current;
            current.once('message', finish);
            current.once('error', (error: Error) =>
                finish({ hook: 'run', message: error.message, ok: false })
            );
            current.once('exit', (code) =>
                finish({
                    hook: 'run',
                    message: `the worker exited with code ${code}`,
                    ok: false
                })
            );
        });

    const drain = async () => {
        running = true;

        do {
            queued = false;
            await runOnce();
        } while (queued && !stopped);

        running = false;
    };

    const schedule = () => {
        if (stopped) {
            return;
        }

        if (running) {
            queued = true;

            return;
        }

        void drain();
    };

    // esbuild has just rewritten every shell's `index.html` with the
    // current chunk names; snapshot them as the shells the run injects into,
    // before a run in flight can write rendered markup over them.
    const refreshShells = async () => {
        for (const route of config.routes) {
            const shellFile = shellFileOf(outDir, route);

            if (route === '/' || (await exists(shellFile))) {
                await copyFile(routeOutputPath(outDir, route), shellFile);
            }
        }
    };

    const plugin: Plugin = {
        name: 'loom-dev-prerender',
        setup(build) {
            build.onEnd(async ({ errors }) => {
                if (errors.length || stopped) {
                    return;
                }

                renderRoutes && (await refreshShells());
                schedule();
            });
        }
    };

    const stop = async () => {
        stopped = true;
        queued = false;
        await worker?.terminate();
    };

    return { plugin, schedule, stop };
};
