import { build } from 'esbuild';

import { clientConfig } from './config.mjs';
import { rm } from 'node:fs/promises';

// build.mts is the production entry (dev.mts serves dev) — don't depend on
// ambient NODE_ENV, which CI build environments may not set.
const isProd = process.env.NODE_ENV !== 'development';

// './build' is what Vercel serves; LOOM_BUILD_DIR isolates a build (tests,
// CI experiments) without racing a running dev server over ./build.
const outdir = process.env.LOOM_BUILD_DIR || './build';

const run = async () => {
    if (!outdir.startsWith('./')) {
        // Isolated out dir — the clean plugin is skipped there (see config).
        await rm(outdir, { force: true, recursive: true });
    }

    await build(
        clientConfig({
            apiUrl: process.env.API_URL,
            // Preview is an explicit opt-in — production must never default
            // onto Contentful's uncached Preview API.
            ctfIsPreview: process.env.CTF_IS_PREVIEW === 'true',
            isProd,
            outdir
        })
    );

    if (isProd) {
        // The SSG phase: renders the built bundle's routes into the
        // emitted shells. Dev (dev.mts) never runs it.
        const { prerender } = await import('./prerender.mjs');

        await prerender(outdir);
    }
};

run().catch((buildError) => {
    console.error(buildError);
    process.exit(1);
});
