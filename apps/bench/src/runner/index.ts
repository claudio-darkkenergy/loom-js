// `pnpm bench`: build every framework's page, measure, write the results.
// `--build-only` stops after the build (for poking at the pages by hand).
// `--only a,b` restricts the framework set (dev convenience; the written
// results are then partial and the loom build will reject them).
import type { BenchResults, FrameworkId, FrameworkResult } from '../types.ts';
import { buildAll } from './build.ts';
import { launchBrowser } from './chrome.ts';
import { captureEnvironment } from './environment.ts';
import { measureHeap, measureOps, measureStartup } from './measure.ts';
import { serveStatic } from './serve.ts';
import { installedVersion } from './versions.ts';
import { RESULTS_FILE, writeResults } from './write.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..'
);
const distDir = path.join(root, '.bench-dist');

const readFlag = (name: string) => {
    const index = process.argv.indexOf(name);

    return index === -1 ? undefined : (process.argv[index + 1] ?? '');
};

const run = async () => {
    const only = readFlag('--only')?.split(',').filter(Boolean) as
        FrameworkId[] | undefined;
    const built = await buildAll(
        root,
        distDir,
        only?.length ? only : undefined
    );

    if (process.argv.includes('--build-only')) {
        console.info(`> built ${built.length} page(s) into ${distDir}`);

        return;
    }

    const server = await serveStatic(distDir);
    const browser = await launchBrowser();

    try {
        const environment = await captureEnvironment(browser);

        console.info(
            `> ${environment.chrome} on ${environment.cpuModel} (${environment.runner})`
        );

        const ops = await measureOps(browser, server.origin, built);
        const frameworks: FrameworkResult[] = [];

        for (const framework of built) {
            const { spec } = framework;

            frameworks.push({
                id: spec.id,
                name: spec.name,
                version: spec.versionPackage
                    ? installedVersion(spec.versionPackage, root)
                    : null,
                bundle: framework.bundle,
                startupMs: await measureStartup(
                    browser,
                    server.origin,
                    framework
                ),
                heapBytes: await measureHeap(browser, server.origin, framework),
                ops: ops.get(spec.id) as FrameworkResult['ops']
            });
            console.info(
                `> ${spec.id}: startup ${frameworks.at(-1)?.startupMs.median.toFixed(1)}ms · heap ${(
                    (frameworks.at(-1)?.heapBytes.median ?? 0) /
                    1024 /
                    1024
                ).toFixed(1)}MB`
            );
        }

        const results: BenchResults = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            environment,
            frameworks
        };

        await writeResults(root, results);
        console.info(`> wrote ${RESULTS_FILE}`);
    } finally {
        await browser.close();
        await server.close();
    }
};

run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
