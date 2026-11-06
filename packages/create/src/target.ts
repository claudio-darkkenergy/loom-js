// The target directory: its package name, and the never-clobber guard.
import { UsageError } from './args';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

// npm's rules for an unscoped name: lowercase, URL-safe, no leading `.`/`_`.
const NPM_NAME = /^[a-z0-9~-][a-z0-9._~-]*$/;
const NPM_NAME_MAX = 214;

/** The package name for `target`: its basename, lowercased, spaces dashed. */
export const packageNameOf = (target: string, cwd: string) => {
    const name = path
        .basename(path.resolve(cwd, target))
        .toLowerCase()
        .replace(/\s+/g, '-');

    if (!NPM_NAME.test(name) || name.length > NPM_NAME_MAX) {
        throw new UsageError(
            `"${name}" is not a valid npm package name; pick another directory name.`
        );
    }

    return name;
};

/** Whether `directory` exists; throws when it holds anything but `.git`. */
export const checkTarget = async (directory: string) => {
    let entries: string[];

    try {
        entries = await readdir(directory);
    } catch {
        return { exists: false };
    }

    const occupied = entries.filter((entry) => entry !== '.git');

    if (occupied.length > 0) {
        throw new UsageError(
            `${directory} is not empty (${occupied.slice(0, 3).join(', ')}${
                occupied.length > 3 ? ', …' : ''
            }); pick an empty or new directory.`
        );
    }

    return { exists: true };
};
