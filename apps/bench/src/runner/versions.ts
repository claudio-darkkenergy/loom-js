// Installed framework versions — read from the packages themselves, never
// from the manifest's range.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * The `version` of `packageName` as installed for `fromDir`: its entry is
 * resolved, then the nearest `package.json` above the entry that carries
 * the package's name is read — `exports` maps rarely expose the manifest
 * itself. Throws when the package is not installed.
 */
export const installedVersion = (
    packageName: string,
    fromDir: string
): string => {
    const require = createRequire(path.join(fromDir, 'noop.js'));
    let directory = path.dirname(require.resolve(packageName));

    while (directory !== path.dirname(directory)) {
        const manifestPath = path.join(directory, 'package.json');

        if (existsSync(manifestPath)) {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
                name?: string;
                version?: string;
            };

            if (manifest.name === packageName && manifest.version) {
                return manifest.version;
            }
        }

        directory = path.dirname(directory);
    }

    throw new Error(`[bench] ${packageName}: no installed version found.`);
};
