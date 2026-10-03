import { build } from 'esbuild';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serves `tests/support/minified/<name>.ts` bundled with esbuild `minify`
// (no `keepNames`) at `/__minified__/<name>.js`, so a browser spec can run a
// consumer-shaped bundle — its own core copy, every function renamed — and
// prove detection does not lean on `Function.name`.
export const MINIFIED_PREFIX = '/__minified__/';

const fixturesDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    'minified'
);

export const minifiedFixturePlugin = () => ({
    name: 'loom-minified-fixture',
    async serve(context) {
        if (!context.path.startsWith(MINIFIED_PREFIX)) {
            return;
        }

        const name = context.path.slice(MINIFIED_PREFIX.length, -'.js'.length);
        const result = await build({
            bundle: true,
            entryPoints: [resolve(fixturesDir, `${name}.ts`)],
            format: 'esm',
            minify: true,
            target: 'es2022',
            write: false
        });

        return {
            body: result.outputFiles[0].text,
            type: 'js'
        };
    }
});
