// `@loom-js/build` against the built `dist/` entry, driving the fixture app
// under `tests/fixtures/app` end to end: config loading, mode resolution,
// shell resolution, a production build with the prerender phase, a re-run,
// a development build, the escape hatch, and the CLI. Run via `pnpm test-ci`.
import { describe, it } from 'node:test';

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const {
    build,
    createBuildOptions,
    loadConfig,
    prerender,
    resolveConfig,
    resolveMode,
    shellRouteOf
} = await import('../dist/index.mjs');

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(here, 'fixtures/app');
const binPath = path.join(here, '../bin/loom.mjs');
const run = promisify(execFile);

const exists = (filePath) =>
    access(filePath).then(
        () => true,
        () => false
    );
const read = (outDir, file) => readFile(path.join(outDir, file), 'utf8');
const tempOutDir = () => mkdtemp(path.join(tmpdir(), 'loom-build-'));

const resolveFixture = async (mode, outDir) => {
    const { config } = await loadConfig(fixtureRoot);

    return resolveConfig(config, { cwd: fixtureRoot, mode, outDir });
};

describe('config loading', () => {
    it('loads a TypeScript config with a bundled relative import', async () => {
        const { config, file } = await loadConfig(fixtureRoot);

        assert.equal(file, path.join(fixtureRoot, 'loom.config.ts'));
        assert.equal(typeof config, 'function');

        const resolved = await resolveConfig(config, {
            cwd: fixtureRoot,
            mode: 'production'
        });

        assert.equal(resolved.root, fixtureRoot);
        assert.equal(resolved.outDir, path.join(fixtureRoot, 'build'));
        assert.deepEqual(resolved.routes, ['/', '/docs']);
        assert.deepEqual(resolved.define, {
            __FIXTURE_NAME__: 'fixture (production)'
        });
        assert.equal(resolved.server.port, 1999);
        assert.equal(typeof resolved.prerender.routes, 'function');
        assert.equal(resolved.prerender.preloadFonts, true);
    });

    it('hands the function form its mode', async () => {
        const resolved = await resolveFixture('development');

        assert.equal(resolved.define.__FIXTURE_NAME__, 'fixture (development)');
    });

    it('fails without a config file', async () => {
        await assert.rejects(loadConfig(tmpdir()), /no loom\.config\.ts found/);
    });
});

describe('mode resolution', () => {
    it('is production unless asked otherwise', () => {
        assert.equal(resolveMode(undefined, {}), 'production');
        assert.equal(
            resolveMode(undefined, { NODE_ENV: 'development' }),
            'development'
        );
        assert.equal(
            resolveMode('production', { NODE_ENV: 'development' }),
            'production'
        );
        assert.equal(resolveMode('development', {}), 'development');
        assert.throws(() => resolveMode('staging', {}), /unknown mode/);
    });
});

describe('shell resolution', () => {
    it('picks the longest configured route prefix', () => {
        const routes = ['/', '/docs', '/docs/api'];

        assert.equal(shellRouteOf('/', routes), '/');
        assert.equal(shellRouteOf('/docs', routes), '/docs');
        assert.equal(shellRouteOf('/docs/alpha', routes), '/docs');
        assert.equal(shellRouteOf('/docs/api/activity', routes), '/docs/api');
        assert.equal(shellRouteOf('/blog/post', routes), '/');
        assert.equal(shellRouteOf('/docsy', routes), '/');
        assert.throws(() => shellRouteOf('/x', ['/docs']), /no configured route/);
    });
});

describe('build options', () => {
    it('applies the esbuild escape hatch last', async () => {
        const resolved = await resolveFixture('production');
        const options = createBuildOptions({
            ...resolved,
            esbuild: (base) => ({ ...base, keepNames: false })
        });

        assert.equal(options.keepNames, false);
        assert.equal(options.minify, true);
        assert.equal(options.define.__DEV__, 'false');
        assert.equal(options.define.__FIXTURE_NAME__, '"fixture (production)"');
        assert.ok('static/js/spa' in options.entryPoints);
        assert.ok('static/styles/base' in options.entryPoints);
        assert.ok('static/js/prerender' in options.entryPoints);
    });
});

describe('production build', () => {
    it('bundles, emits shells, copies assets and prerenders', async () => {
        const outDir = await tempOutDir();
        const resolved = await resolveFixture('production', outDir);

        await build(resolved);

        for (const file of [
            'static/js/spa.js',
            'static/styles/base.css',
            'static/robots.txt',
            'shell.html',
            'index.html',
            'docs/index.html',
            'docs/alpha/index.html',
            'docs/beta/index.html',
            'after.txt'
        ]) {
            assert.ok(await exists(path.join(outDir, file)), `${file} exists`);
        }

        const shell = await read(outDir, 'shell.html');
        const home = await read(outDir, 'index.html');
        const docsShell = await read(outDir, 'docs/index.html');
        const alpha = await read(outDir, 'docs/alpha/index.html');

        // Pristine shells keep empty slots; rendered routes fill them.
        assert.match(shell, /<div id="loom-app" style="height: 100%"><\/div>/);
        assert.match(shell, /<script id="loom-state" type="application\/json"><\/script>/);
        assert.match(docsShell, /<div id="loom-app" style="height: 100%"><\/div>/);
        assert.match(home, /<h1>\/<\/h1>/);
        assert.match(home, /hello from loom/);
        assert.match(home, /"fixture:greeting"/);
        assert.match(alpha, /<h1>\/docs\/alpha<\/h1>/);

        // Template layering: title per scope, head markup, body class.
        assert.match(shell, /<title>Fixture<\/title>/);
        assert.match(docsShell, /<title>Docs \| Fixture<\/title>/);
        assert.match(shell, /dns-prefetch/);
        assert.match(shell, /<body class="theme-fixture">/);

        // Shells reference the client, never the prerender bundle.
        assert.match(shell, /src="\/static\/js\/spa\.js"/);
        assert.match(shell, /href="\/static\/styles\/base\.css"/);
        assert.doesNotMatch(shell, /prerender/);
        assert.match(shell, /window\.__ROUTE_ASSETS__/);

        const spa = await read(outDir, 'static/js/spa.js');

        assert.match(spa, /fixture \(production\)/);
        assert.ok(!(await exists(path.join(outDir, 'static/js/spa.js.map'))));

        // Re-running the phase alone reproduces the same output.
        await prerender(resolved);

        assert.equal(await read(outDir, 'index.html'), home);
        assert.equal(await read(outDir, 'docs/alpha/index.html'), alpha);
        assert.equal(await read(outDir, 'shell.html'), shell);
    });
});

describe('development build', () => {
    it('keeps sourcemaps, dev defines, and never prerenders', async () => {
        const outDir = await tempOutDir();
        const resolved = await resolveFixture('development', outDir);

        await build(resolved);

        const home = await read(outDir, 'index.html');
        const spa = await read(outDir, 'static/js/spa.js');

        assert.match(home, /<div id="loom-app" style="height: 100%"><\/div>/);
        assert.match(spa, /fixture \(development\)/);
        assert.ok(await exists(path.join(outDir, 'static/js/spa.js.map')));
        assert.ok(!(await exists(path.join(outDir, 'shell.html'))));
        assert.ok(!(await exists(path.join(outDir, 'after.txt'))));
        assert.ok(!(await exists(path.join(outDir, 'docs/alpha'))));
    });
});

describe('cli', () => {
    it('builds from the config in cwd with --outDir', async () => {
        const outDir = await tempOutDir();
        const { stdout } = await run(process.execPath, [binPath, 'build', '--outDir', outDir], {
            cwd: fixtureRoot
        });

        assert.match(stdout, /prerender complete: 3 route\(s\)/);
        assert.ok((await readdir(outDir)).includes('shell.html'));
    });

    it('rejects an unknown command', async () => {
        await assert.rejects(
            run(process.execPath, [binPath, 'bogus'], { cwd: fixtureRoot }),
            /unknown command "bogus"/
        );
    });
});
