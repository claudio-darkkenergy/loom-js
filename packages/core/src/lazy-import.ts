import { activity } from './activity';

const lazyLoadedCache = new Map<string | Symbol, ReturnType<typeof activity>>();

/**
 * Takes an import path & lazy loads a resource utilizing a subscribable activity.
 * @param path The import path
 * @returns An activity for the dynamic lazy import.
 */
export const lazyImport = <ImportType>(
    key: string | Symbol,
    importer: () => Promise<ImportType>
) => {
    // Check cache
    if (lazyLoadedCache.has(key)) {
        // Return the cached activity for the import key.
        return lazyLoadedCache.get(key) as ReturnType<typeof activity>;
    }

    // Otherwise, create & cache a new activity for the import key & return.
    const importActivity = activity<ImportType | {}>({});

    lazyLoadedCache.set(key, importActivity);
    importer().then(importActivity.update);

    return importActivity;
};
