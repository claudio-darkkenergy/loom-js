import { activity } from './activity';

type LazyImportCache<V> = Map<string | Symbol, ReturnType<typeof activity<V>>>;

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
    const cache: LazyImportCache<ImportType | undefined> = lazyImportCache;

    // Check cache
    if (cache.has(key)) {
        // Return the cached activity for the import key.
        return cache.get(key) as ReturnType<typeof activity>;
    }

    // Otherwise, create & cache a new activity for the import key & return.
    const importActivity = activity<ImportType | undefined>(undefined);

    cache.set(key, importActivity);
    importer().then(importActivity.update);

    return importActivity;
};
