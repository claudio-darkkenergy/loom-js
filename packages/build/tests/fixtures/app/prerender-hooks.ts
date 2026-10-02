// A relative import from the config, so the loader's bundling is exercised.
import type { PrerenderOptions } from '@loom-js/build';

export const prerenderHooks: PrerenderOptions = {
    after: async ({ outDir }) => {
        const { writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');

        await writeFile(join(outDir, 'after.txt'), 'after ran');
    },
    entry: './src/prerender.entry.ts',
    preloadFonts: true,
    routes: (bundle) => (bundle.listPages as () => Promise<string[]>)(),
    validate: (route, { html }) => {
        if (!html.includes(route)) {
            throw new Error(`[fixture] ${route} did not render its path.`);
        }
    }
};
