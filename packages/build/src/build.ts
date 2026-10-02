import { build as esbuildBuild } from 'esbuild';

import type { ResolvedConfig } from './config';
import { createBuildOptions } from './esbuild-options';
import { prerender } from './prerender';
import { rm } from 'node:fs/promises';

/**
 * One production (or development) build: wipes `outDir`, bundles, emits the
 * shells, then — in production, when `prerender` is configured — runs the
 * prerender phase against the fresh output.
 */
export const build = async (config: ResolvedConfig) => {
    await rm(config.outDir, { force: true, recursive: true });
    await esbuildBuild(createBuildOptions(config));

    if (config.mode === 'production' && config.prerender) {
        await prerender(config);
    }
};
