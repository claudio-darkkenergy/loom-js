// A relative import from the config, so the loader's bundling is exercised.
import type { PrerenderOptions } from '@loom-js/build';

export const prerenderHooks: PrerenderOptions = {
    artifacts: async ({ bundle, mode, outDir }) => {
        if (process.env.LOOM_FIXTURE_ARTIFACTS_THROW) {
            throw new Error('fixture artifacts failure');
        }

        const { writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');

        await writeFile(
            join(outDir, 'artifacts.txt'),
            `${mode} ${(bundle.artifactStamp as () => string)()}`
        );
    },
    entry: './src/prerender.entry.ts',
    meta: (route) =>
        route === '/docs/alpha'
            ? {
                  description: 'About <alpha> & its $& kin',
                  title: 'Alpha "one" | Fixture'
              }
            : undefined,
    preloadFonts: true,
    routes: (bundle) => (bundle.listPages as () => Promise<string[]>)(),
    validate: (route, { html }) => {
        if (!html.includes(route)) {
            throw new Error(`[fixture] ${route} did not render its path.`);
        }
    }
};
