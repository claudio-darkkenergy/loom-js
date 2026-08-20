import { activity } from './activity';
import type { ContextFunction } from './types';

const lazyImportCache = new Map();

// The concrete activity instantiation a lazy import presents — `effect`,
// `watch` & `value()` all carry `ImportType | undefined` (`undefined` until
// the import resolves).
export type LazyImportActivity<ImportType> = ReturnType<
    typeof activity<ImportType | undefined, () => Promise<ImportType>>
>;

/**
 * Takes an import path & lazy loads a resource utilizing a subscribable activity.
 * @param key The cache key
 * @param importer The import function
 * @returns An activity for the dynamic lazy import.
 */
export const lazyImport = <ImportType>(
    key: string | Symbol,
    importer: () => Promise<ImportType>
): LazyImportActivity<ImportType> => {
    const cache = lazyImportCache;

    // Check cache
    if (cache.has(key)) {
        // Return the cached activity for the import key.
        return cache.get(key) as LazyImportActivity<ImportType>;
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

// The renderable-content convenience over `lazyImport`: the importer resolves
// a `ContextFunction | undefined` & the path doubles as the cache key.
export const importLazy = (
    path: string,
    fallback: () => Promise<ContextFunction | undefined> = () =>
        Promise.resolve(undefined)
): LazyImportActivity<ContextFunction | undefined> => {
    return lazyImport<ContextFunction | undefined>(path, fallback);
};
