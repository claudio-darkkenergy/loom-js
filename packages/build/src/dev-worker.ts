// One `loom dev` prerender run per worker thread. A fresh worker has a fresh
// module cache, so the bundle and its content-hashed shared chunks load with
// current code and no state from the previous run.
import type { ConfigSource } from './config';
import { loadConfig } from './load-config';
import {
    loadBundle,
    renderRoutes,
    runArtifacts,
    runSetup,
    type PrerenderStep
} from './prerender';
import { resolveConfig } from './resolve-config';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

export interface DevRunInput {
    configSource: ConfigSource;
    outDir: string;
    renderRoutes: boolean;
}

export type DevRunResult =
    | { ok: true; routeCount: number }
    | { ok: false; hook: PrerenderStep | 'run'; message: string };

/** Reloads the config, then runs load → setup → (routes) → artifacts. */
export const runDevPrerender = async ({
    configSource,
    outDir,
    renderRoutes: withRoutes
}: DevRunInput): Promise<DevRunResult> => {
    let step: PrerenderStep = 'config';
    const onStep = (next: PrerenderStep) => {
        step = next;
    };

    try {
        const { config } = await loadConfig(
            configSource.cwd,
            configSource.file
        );
        const resolved = await resolveConfig(config, {
            configFile: configSource.file,
            cwd: configSource.cwd,
            mode: 'development',
            outDir
        });

        onStep('load');

        const bundle = await loadBundle(outDir);

        onStep('setup');
        await runSetup(resolved, bundle);

        const routeCount = withRoutes
            ? await renderRoutes(resolved, bundle, onStep)
            : 0;

        onStep('artifacts');
        await runArtifacts(resolved, bundle);

        return { ok: true, routeCount };
    } catch (error) {
        return {
            hook: step,
            message: error instanceof Error ? error.message : String(error),
            ok: false
        };
    }
};

if (!isMainThread && parentPort) {
    const port = parentPort;

    void runDevPrerender(workerData as DevRunInput).then((result) =>
        port.postMessage(result)
    );
}
