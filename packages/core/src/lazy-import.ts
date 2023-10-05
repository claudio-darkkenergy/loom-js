import { activity } from './activity';

const lazyLoadedCache = new Map<string, object>();

/**
 * Takes an import path & lazy loads a resource utilizing a subscribable activity.
 * @param path The import path
 * @returns An activity for the dynamic lazy import.
 */
export const lazyImport = <ImportType>(path: string) => {
    if (lazyLoadedCache.has(path)) {
        const {
            reset: _,
            update: __,
            ...importActivity
        } = lazyLoadedCache.get(path) as ReturnType<typeof activity>;
        return importActivity;
    }

    const importActivity = activity<ImportType | {}>({});

    lazyLoadedCache.set(path, importActivity);
    import(path).then(importActivity.update);

    return importActivity;
};
