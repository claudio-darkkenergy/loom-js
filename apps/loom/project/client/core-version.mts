// The `@loom-js/core` version the app builds against, read from the
// installed package's manifest for the header's release status.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * Reads `@loom-js/core`'s version from the manifest installed under
 * `appDir`. Core's `exports` map hides `./package.json`, so it's read by
 * path. Throws, naming the manifest, when it's missing or not semver.
 */
export const readCoreVersion = (appDir: string) => {
    const manifestPath = path.join(
        appDir,
        'node_modules/@loom-js/core/package.json'
    );
    let version: unknown;

    try {
        ({ version } = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
            version?: unknown;
        });
    } catch (error) {
        throw new Error(
            `[core-version] ${manifestPath} could not be read (${
                error instanceof Error ? error.message : String(error)
            }).`
        );
    }

    if (typeof version !== 'string' || !SEMVER.test(version)) {
        throw new Error(
            `[core-version] ${manifestPath} has no semver "version" (got ${JSON.stringify(version)}).`
        );
    }

    return version;
};
