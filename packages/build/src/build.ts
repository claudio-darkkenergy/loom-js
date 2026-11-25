import { build as esbuildBuild } from 'esbuild';

import type { ResolvedConfig } from './config';
import { createBuildOptions } from './esbuild-options';
import { loadBundle, prerender, runArtifacts, runSetup } from './prerender';
import { rm } from 'node:fs/promises';

/**
 * One production (or development) build: wipes `outDir`, bundles, emits the
 * shells, then — when `prerender` is configured — runs the full prerender
 * phase in production, or only `setup` and `artifacts` in development.
 */
export const build = async (config: ResolvedConfig) => {
    await rm(config.outDir, { force: true, recursive: true });
    await esbuildBuild(createBuildOptions(config));

    if (!config.prerender) {
        return;
    }

    if (config.mode === 'production') {
        await prerender(config);

        return;
    }

    const bundle = await loadBundle(config.outDir);

    await runSetup(config, bundle);
    await runArtifacts(config, bundle);
};
