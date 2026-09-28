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

/**
 * Lazy loads renderable content. Works like `lazyImport`, but the import
 * path doubles as the cache key & the importer resolves content that is
 * ready to render.
 * @param path The import path, also used as the cache key
 * @param importer The import function; resolves `undefined` when omitted
 * @returns An activity for the lazily imported content.
 */
export const lazyContent = (
    path: string,
    importer: () => Promise<ContextFunction | undefined> = () =>
        Promise.resolve(undefined)
): LazyImportActivity<ContextFunction | undefined> => {
    return lazyImport<ContextFunction | undefined>(path, importer);
};
