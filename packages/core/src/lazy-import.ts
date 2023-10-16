import { activity } from './activity';

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
        input && update(await input());
    });

    cache.set(key, importActivity);
    importActivity.update(importer);

    return importActivity;
};
