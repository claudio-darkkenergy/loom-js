import { activity } from './activity';
import type { ContextFunction } from './types';

const lazyImportCache = new Map();

/**
 * Takes an import path & lazy loads a resource utilizing a subscribable activity.
 * @param key The cache key
 * @param importer The import function
 * @returns An activity for the dynamic lazy import.
 */
export const lazyImport = <ImportType>(
    key: string | Symbol,
    importer: () => Promise<ImportType>
) => {
    const cache = lazyImportCache;

    // Check cache
    if (cache.has(key)) {
        // Return the cached activity for the import key.
        return cache.get(key) as ReturnType<typeof activity>;
    }

    // Otherwise, create & cache a new activity for the import key & return.
    const importActivity = activity<
        ImportType | undefined,
        () => Promise<ImportType>
    >(undefined, async ({ input, update }) => {
        const resolvedImport = await input();
        update(resolvedImport);
    });

    cache.set(key, importActivity);
    importActivity.update(importer);

    return importActivity;
};

// @TODO Determine why I created this & if its still needed.
// It seems to be a typed helper of the original lazyImport function.
export const importLazy = (
    path: string,
    fallback: () => Promise<ContextFunction | undefined> = () =>
        Promise.resolve(undefined)
) => {
    return lazyImport<ContextFunction | undefined>(path, fallback);
};
